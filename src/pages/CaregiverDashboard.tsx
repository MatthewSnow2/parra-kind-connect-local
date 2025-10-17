/**
 * Caregiver Dashboard Component
 *
 * Secure dashboard for caregivers with validated note input.
 *
 * Security Features:
 * - Note validation using Zod schemas
 * - Input sanitization to prevent XSS
 * - Rate limiting to prevent spam
 * - User authentication and authorization
 * - Content length limits
 *
 * @example
 * Navigate to /caregiver/dashboard to access this page
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StatusIndicator from "@/components/StatusIndicator";
import InteractionTimeline from "@/components/InteractionTimeline";
import MoodIndicator from "@/components/MoodIndicator";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, MessageCircle, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { openWhatsAppChat, formatSummaryForWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";
import { noteTextSchema } from "@/lib/validation/schemas";
import { sanitizeText } from "@/lib/validation/sanitization";
import { checkRateLimit, recordRateLimitedAction, RATE_LIMITS } from "@/lib/validation/rate-limiting";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CaregiverDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  // Fetch all active care relationships for this caregiver
  const { data: careRelationships, isLoading: relationshipsLoading } = useQuery({
    queryKey: ["care-relationships", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("care_relationships")
        .select(`
          patient_id,
          relationship_type,
          status,
          patient:profiles!care_relationships_patient_id_fkey(id, full_name, display_name, email)
        `)
        .eq("caregiver_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Set the first patient as selected by default when relationships load
  React.useEffect(() => {
    if (careRelationships && careRelationships.length > 0 && !selectedPatientId) {
      setSelectedPatientId(careRelationships[0].patient_id);
    }
  }, [careRelationships, selectedPatientId]);

  const patientId = selectedPatientId || careRelationships?.[0]?.patient_id;

  // Fetch patient profile
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      if (!patientId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch today's daily summary
  const { data: todaySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["daily-summary", patientId],
    queryFn: async () => {
      if (!patientId) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("patient_id", patientId)
        .eq("summary_date", today)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch recent notes for this patient
  const { data: recentNotes, isLoading: notesLoading, refetch: refetchNotes } = useQuery({
    queryKey: ["caregiver-recent-notes", patientId, user?.id],
    queryFn: async () => {
      if (!patientId || !user?.id) return [];

      const { data, error } = await supabase
        .from("caregiver_notes")
        .select("*")
        .eq("patient_id", patientId)
        .eq("caregiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!patientId && !!user?.id,
  });

  const isLoading = relationshipsLoading || patientLoading || summaryLoading;

  const patientName = patient?.display_name || patient?.full_name || "Patient";
  const status: "ok" | "warning" | "alert" = todaySummary?.overall_status || "ok";
  const mood: "happy" | "neutral" | "sad" | "concerned" =
    (todaySummary?.overall_mood as "happy" | "neutral" | "sad" | "concerned") || "neutral";
  const interactionCount = todaySummary?.check_in_count || 0;
  const analysisText = todaySummary?.summary_text || "No check-ins today yet.";
  const lastUpdateTime = todaySummary?.updated_at
    ? new Date(todaySummary.updated_at).toLocaleTimeString()
    : "Not available";

  const handleSaveNote = async () => {
    if (!notes.trim() || !patientId || !user?.id) return;

    // Validate note with Zod schema
    const validation = noteTextSchema.safeParse(notes.trim());
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid note content";
      toast.error(errorMessage);
      return;
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit('note_create', user.id, RATE_LIMITS.NOTE_CREATE);
    if (!rateLimitCheck.allowed) {
      toast.error(`Too many notes. Please wait ${Math.ceil(rateLimitCheck.resetIn / 1000)} seconds.`);
      return;
    }

    try {
      // Sanitize note text
      const sanitizedNote = sanitizeText(validation.data);

      // Record rate limit action
      recordRateLimitedAction('note_create', user.id);

      const { error } = await supabase
        .from("caregiver_notes")
        .insert({
          patient_id: patientId,
          caregiver_id: user.id,
          note_type: "general",
          note_text: sanitizedNote,
          shared_with_patient: true,
        });

      if (error) throw error;

      toast.success("Note saved successfully");
      setNotes("");
      refetchNotes(); // Refresh the notes list
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  const handleWhatsAppMessage = () => {
    if (!patient?.phone_number) {
      toast.error("Patient phone number not available");
      return;
    }

    const message = `Hi ${patientName}, this is your caregiver checking in. How are you feeling today?`;
    openWhatsAppChat(patient.phone_number, message);
    toast.success("Opening WhatsApp...");
  };

  const handleShareSummary = () => {
    if (!patient?.phone_number) {
      toast.error("Patient phone number not available");
      return;
    }

    if (!todaySummary) {
      toast.error("No summary available to share");
      return;
    }

    const message = formatSummaryForWhatsApp({
      ...todaySummary,
      patient: {
        full_name: patient.full_name,
        display_name: patient.display_name,
      },
    });

    openWhatsAppChat(patient.phone_number, message);
    toast.success("Opening WhatsApp...");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="fixed top-0 left-0 right-0 bg-background border-b border-secondary z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-heading font-bold text-secondary">parra</h1>
            <HamburgerMenu />
          </div>
        </header>
        <main className="flex-1 pt-24 pb-12 px-6 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  // Check if caregiver has access to any patients
  if (!patientId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="fixed top-0 left-0 right-0 bg-background border-b border-secondary z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-heading font-bold text-secondary">parra</h1>
            <HamburgerMenu />
          </div>
        </header>
        <main className="flex-1 pt-24 pb-12 px-6 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-2xl font-heading font-bold text-secondary">
              No Patient Assigned
            </h2>
            <p className="text-muted-foreground">
              You don't have any active care relationships yet. Please contact your administrator
              to be assigned to a patient.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Custom Header */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-secondary z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold text-secondary">parra</h1>
          <HamburgerMenu />
        </div>
      </header>

      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Title and Senior Selector */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-4xl font-heading font-bold text-secondary">
                Monitoring {patientName}
              </h1>

              {/* Senior Selector - only show if caregiver has multiple seniors */}
              {careRelationships && careRelationships.length > 1 && (
                <div className="w-full sm:w-64">
                  <Select value={patientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger className="border-secondary">
                      <SelectValue placeholder="Select a senior" />
                    </SelectTrigger>
                    <SelectContent>
                      {careRelationships.map((relationship) => (
                        <SelectItem key={relationship.patient_id} value={relationship.patient_id}>
                          {(relationship as any).patient?.display_name ||
                           (relationship as any).patient?.full_name ||
                           (relationship as any).patient?.email ||
                           "Unknown Senior"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Top Grid: Status, Interactions, Mood, Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column: Status and Interactions */}
            <div className="space-y-8">
              {/* Status Section */}
              <div className="border-b border-secondary pb-6">
                <h2 className="text-2xl font-heading font-bold text-secondary mb-4">
                  Status
                </h2>
                <StatusIndicator status={status} size="lg" />
              </div>

              {/* Interactions Section */}
              <div>
                <h2 className="text-2xl font-heading font-bold text-secondary mb-4">
                  Interactions
                </h2>
                <InteractionTimeline count={interactionCount} />
              </div>
            </div>

            {/* Right Column: Mood and Notes */}
            <div className="space-y-8">
              {/* Mood Section */}
              <div className="border-b border-secondary pb-6">
                <h2 className="text-2xl font-heading font-bold text-secondary mb-4">
                  Mood
                </h2>
                <MoodIndicator mood={mood} size="lg" />
              </div>

              {/* Notes Section */}
              <div>
                <h2 className="text-2xl font-heading font-bold text-secondary mb-4">
                  Notes
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 w-12 h-12 rounded-full border-2 border-secondary"
                    >
                      <Mic className="w-6 h-6 text-secondary" />
                    </Button>
                    <Textarea
                      placeholder={`Anything ${patientName} needs to know?`}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="flex-1 min-h-[120px] text-lg border-secondary"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveNote}
                      disabled={!notes.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Save Note
                    </Button>
                  </div>

                  {/* Recent Notes List */}
                  {recentNotes && recentNotes.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h3 className="text-lg font-semibold text-secondary">Recent Notes:</h3>
                      <div className="space-y-2">
                        {recentNotes.map((note: any) => (
                          <Card key={note.id} className="p-3 border-l-4 border-primary/50">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(note.created_at).toLocaleString()}
                              </span>
                              {note.shared_with_patient && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  Shared
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{note.note_text}</p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Section */}
          {/* QA: UI/UX fix 2025-10-15 - Removed three green horizontal lines per user request */}
          <div className="border-t border-secondary pt-8 mb-8">
            <h2 className="text-3xl font-heading font-bold text-secondary mb-4">
              Analysis (updated at {lastUpdateTime})
            </h2>
            <div className="space-y-2">
              <p className="text-lg text-foreground mt-4">{analysisText}</p>
            </div>

            {/* WhatsApp Quick Actions */}
            {patient?.phone_number && (
              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsAppMessage}
                  className="border-secondary text-secondary hover:bg-secondary hover:text-background"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message via WhatsApp
                </Button>
                {todaySummary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareSummary}
                    className="border-secondary text-secondary hover:bg-secondary hover:text-background"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Share Summary via WhatsApp
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-background text-2xl px-16 py-8 h-auto rounded-3xl"
              onClick={() => navigate("/senior/chat")}
            >
              Chat
            </Button>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-background text-2xl px-16 py-8 h-auto rounded-3xl"
              onClick={() => navigate("/dashboard/history")}
            >
              Recap
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaregiverDashboard;
