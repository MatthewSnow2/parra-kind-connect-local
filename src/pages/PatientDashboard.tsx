import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StatusIndicator from "@/components/StatusIndicator";
import InteractionTimeline from "@/components/InteractionTimeline";
import MoodIndicator from "@/components/MoodIndicator";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState("");

  // Use authenticated user's ID
  const patientId = user?.id;

  // Use the profile from auth context (already loaded)
  const patient = profile;

  // Fetch today's daily summary
  const { data: todaySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["patient-daily-summary", patientId],
    queryFn: async () => {
      if (!patientId) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("patient_id", patientId)
        .eq("summary_date", today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch caregiver notes shared with patient
  const { data: caregiverNotes, isLoading: notesLoading } = useQuery({
    queryKey: ["caregiver-notes", patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from("caregiver_notes")
        .select(`
          id,
          note_text,
          note_type,
          created_at,
          caregiver:profiles!caregiver_notes_caregiver_id_fkey(full_name, display_name)
        `)
        .eq("patient_id", patientId)
        .eq("shared_with_patient", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const isLoading = summaryLoading || notesLoading;

  const patientName = patient?.display_name || patient?.full_name || "Patient";
  const status: "ok" | "warning" | "alert" = todaySummary?.overall_status || "ok";
  const mood: "happy" | "neutral" | "sad" | "concerned" =
    (todaySummary?.overall_mood as "happy" | "neutral" | "sad" | "concerned") || "neutral";
  const interactionCount = todaySummary?.check_in_count || 0;
  const analysisText = todaySummary?.summary_text || "No check-ins today yet.";
  const lastUpdateTime = todaySummary?.updated_at
    ? new Date(todaySummary.updated_at).toLocaleTimeString()
    : "Not available";

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

              {/* Notes from Caregiver Section */}
              <div>
                <h2 className="text-2xl font-heading font-bold text-secondary mb-4">
                  Notes from Your Caregiver
                </h2>
                {caregiverNotes && caregiverNotes.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {caregiverNotes.map((note: any) => (
                      <Card key={note.id} className="p-4 border-l-4 border-primary">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-secondary">
                            {(note.caregiver as any)?.display_name || (note.caregiver as any)?.full_name || "Your Caregiver"}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(note.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-base text-foreground">{note.note_text}</p>
                        {note.note_type !== 'general' && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                            {note.note_type}
                          </span>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-secondary/30 rounded-lg">
                    <p className="text-muted-foreground">
                      No notes from your caregiver yet.
                    </p>
                  </div>
                )}
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
              onClick={() => navigate("/senior/history")}
            >
              Recap
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
