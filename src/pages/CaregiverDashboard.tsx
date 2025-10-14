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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import StatusIndicator from "@/components/StatusIndicator";
import InteractionTimeline from "@/components/InteractionTimeline";
import MoodIndicator from "@/components/MoodIndicator";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { noteTextSchema } from "@/lib/validation/schemas";
import { sanitizeText } from "@/lib/validation/sanitization";
import { checkRateLimit, recordRateLimitedAction, RATE_LIMITS } from "@/lib/validation/rate-limiting";

const CaregiverDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState("");

  // Get the first patient that this caregiver has access to
  // In a full implementation, you would have a patient selector or get this from URL params
  const { data: careRelationships, isLoading: relationshipsLoading } = useQuery({
    queryKey: ["care-relationships", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("care_relationships")
        .select("patient_id, relationship_type, status")
        .eq("caregiver_id", user.id)
        .eq("status", "active")
        .limit(1);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const patientId = careRelationships?.[0]?.patient_id;

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
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
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
        <Navigation />
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
      <Navigation />

      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <h1 className="text-4xl font-heading font-bold text-secondary mb-8">
            Monitoring {patientName}
          </h1>

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
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Section */}
          <div className="border-t border-secondary pt-8 mb-8">
            <h2 className="text-3xl font-heading font-bold text-secondary mb-4">
              Analysis (updated at {lastUpdateTime})
            </h2>
            <div className="space-y-2">
              <div className="h-1 bg-muted rounded-full" />
              <div className="h-1 bg-muted rounded-full" />
              <div className="h-1 bg-muted rounded-full" />
              <p className="text-lg text-foreground mt-4">{analysisText}</p>
            </div>
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
