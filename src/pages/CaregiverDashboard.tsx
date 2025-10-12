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
import { toast } from "sonner";

const CaregiverDashboard = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");

  // For now, we'll use the first patient (Margaret) - in production this would come from auth/context
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
    queryKey: ["daily-summary", testPatientId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("patient_id", testPatientId)
        .eq("summary_date", today)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
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

  const handleSaveNote = async () => {
    if (!notes.trim()) return;

    try {
      // For now we'll use a placeholder caregiver ID - in production this would come from auth
      const caregiverId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

      const { error } = await supabase
        .from("caregiver_notes")
        .insert({
          patient_id: testPatientId,
          caregiver_id: caregiverId,
          note_type: "general",
          note_text: notes,
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
              onClick={() => navigate("/senior/chat?mode=type")}
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
