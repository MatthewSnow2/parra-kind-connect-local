import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import StatusIndicator from "@/components/StatusIndicator";
import InteractionTimeline from "@/components/InteractionTimeline";
import MoodIndicator from "@/components/MoodIndicator";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const patientName = "Sarah"; // TODO: Get from user context

  // Mock data - TODO: Replace with real data
  const status: "ok" | "warning" | "alert" = "ok";
  const mood: "happy" | "neutral" | "sad" | "concerned" = "happy";
  const interactionCount = 5;
  const analysisText = "Had a good morning chat. Took medication on time. Planning a short walk after lunch.";
  const lastUpdateTime = "00:00:00";

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
                  Notes
                </h2>
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
