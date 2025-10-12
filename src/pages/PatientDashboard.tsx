import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import StatusIndicator from "@/components/StatusIndicator";
import InteractionTimeline from "@/components/InteractionTimeline";
import MoodIndicator from "@/components/MoodIndicator";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");

  // For now, we'll use the first patient (Margaret) - in production this would come from auth
  const testPatientId = "11111111-1111-1111-1111-111111111111";

  // Fetch patient profile
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", testPatientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", testPatientId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch today's daily summary
  const { data: todaySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["patient-daily-summary", testPatientId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("patient_id", testPatientId)
        .eq("summary_date", today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch notes shared with patient
  const { data: caregiverNotes } = useQuery({
    queryKey: ["patient-notes", testPatientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_notes")
        .select("*, caregiver:profiles!caregiver_notes_caregiver_id_fkey(display_name, full_name)")
        .eq("patient_id", testPatientId)
        .eq("shared_with_patient", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const isLoading = patientLoading || summaryLoading;

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
        <Navigation />
        <main className="flex-1 pt-24 pb-12 px-6 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

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

              {/* Notes Section */}
              <div>
                <h2 className="text-2xl font-heading font-bold text-secondary mb-4">
                  Messages from Your Care Team
                </h2>
                {caregiverNotes && caregiverNotes.length > 0 ? (
                  <div className="space-y-3">
                    {caregiverNotes.map((note: any) => (
                      <div
                        key={note.id}
                        className="p-4 bg-muted/50 rounded-lg border border-secondary/20"
                      >
                        <p className="text-sm text-muted-foreground mb-1">
                          From {note.caregiver?.display_name || note.caregiver?.full_name || 'Your caregiver'}
                        </p>
                        <p className="text-lg">{note.note_text}</p>
                        {note.is_reminder && note.reminder_date && (
                          <p className="text-sm text-primary mt-2">
                            Reminder: {new Date(note.reminder_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No messages yet</p>
                )}
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
              onClick={() => navigate("/senior/chat?mode=type")}
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
