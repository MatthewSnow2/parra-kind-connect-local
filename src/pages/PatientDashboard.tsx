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
import { Mic, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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


  const isLoading = summaryLoading;

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

              {/* Notes Section */}
              <div>
                <h2 className="text-2xl font-heading font-bold text-secondary mb-4">
                  Notes
                </h2>
                <div className="relative">
                  <div className="absolute top-3 left-3 text-secondary">
                    <Mic className="w-6 h-6" />
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes here..."
                    className="pl-12 min-h-[120px] text-lg border-2 border-secondary/30 focus:border-secondary"
                  />
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
