import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import StatusIndicator from "@/components/StatusIndicator";
import InteractionTimeline from "@/components/InteractionTimeline";
import MoodIndicator from "@/components/MoodIndicator";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HistoryEntry {
  date: string;
  status: "ok" | "warning" | "alert";
  mood: "happy" | "neutral" | "sad" | "concerned";
  interactions: number;
  summary: string;
  highlights?: string[];
  concerns?: string[];
}

const HistoryView = () => {
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "list"; // 'list' or 'detail'
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<7 | 14 | 30>(7);

  // For now, use test patient ID - in production this would come from auth
  const testPatientId = "11111111-1111-1111-1111-111111111111";

  // Fetch daily summaries
  const { data: summaries, isLoading } = useQuery({
    queryKey: ["daily-summaries", testPatientId, timePeriod],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timePeriod);

      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("patient_id", testPatientId)
        .gte("summary_date", startDate.toISOString().split('T')[0])
        .order("summary_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const historyData: HistoryEntry[] = summaries?.map(summary => ({
    date: new Date(summary.summary_date).toLocaleDateString(),
    status: summary.overall_status,
    mood: (summary.overall_mood as "happy" | "neutral" | "sad" | "concerned") || "neutral",
    interactions: summary.check_in_count,
    summary: summary.summary_text || "No summary available",
    highlights: summary.highlights || undefined,
    concerns: summary.concerns || undefined,
  })) || [];

  const selectedEntry = selectedDate
    ? historyData.find(entry => entry.date === selectedDate)
    : null;

  const handleExport = () => {
    // TODO: Implement export functionality
    const csvContent = historyData
      .slice(0, timePeriod)
      .map(entry => `${entry.date},${entry.status},${entry.mood},${entry.interactions},"${entry.summary}"`)
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parra-history-${timePeriod}days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (view === "detail" && selectedEntry) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />

        <main className="flex-1 pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header with date and export */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <Input
                  type="text"
                  value={selectedEntry.date}
                  readOnly
                  className="text-3xl font-heading font-bold w-64 border-b-2 border-secondary bg-transparent"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                className="w-12 h-12"
              >
                <Upload className="w-6 h-6 text-secondary" />
              </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Status */}
              <div>
                <StatusIndicator status={selectedEntry.status} size="lg" />
              </div>

              {/* Mood */}
              <div>
                <MoodIndicator mood={selectedEntry.mood} size="lg" />
              </div>

              {/* Interactions */}
              <div>
                <InteractionTimeline count={selectedEntry.interactions} />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-12">
              <h2 className="text-3xl font-heading font-bold text-secondary mb-6">
                Summary
              </h2>
              <div className="bg-muted rounded-xl p-8">
                <p className="text-xl text-foreground leading-relaxed">
                  {selectedEntry.summary}
                </p>
              </div>
            </div>

            {/* Highlights */}
            {selectedEntry.highlights && selectedEntry.highlights.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-heading font-bold text-primary mb-4">
                  Highlights
                </h3>
                <ul className="space-y-2">
                  {selectedEntry.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span className="text-lg">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {selectedEntry.concerns && selectedEntry.concerns.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-heading font-bold text-alert mb-4">
                  Concerns
                </h3>
                <ul className="space-y-2">
                  {selectedEntry.concerns.map((concern, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-alert mt-1">⚠</span>
                      <span className="text-lg">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Back Button */}
            <div className="mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSelectedDate(null)}
                className="text-lg"
              >
                Back to History
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: Time period selector and date list */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-5xl font-heading font-bold text-secondary">
                  History
                </h1>
                <div className="flex gap-4 text-2xl font-heading font-bold text-secondary">
                  <button
                    onClick={() => setTimePeriod(7)}
                    className={`${timePeriod === 7 ? 'underline' : ''}`}
                  >
                    7
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => setTimePeriod(14)}
                    className={`${timePeriod === 14 ? 'underline' : ''}`}
                  >
                    14
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => setTimePeriod(30)}
                    className={`${timePeriod === 30 ? 'underline' : ''}`}
                  >
                    30
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {historyData.slice(0, timePeriod).map((entry) => (
                  <button
                    key={entry.date}
                    onClick={() => setSelectedDate(entry.date)}
                    className="block w-full text-left"
                  >
                    <div className="bg-background rounded-xl p-4 border-b-4 border-secondary hover:shadow-lg transition-all">
                      <div className="text-2xl font-heading font-bold text-secondary">
                        {entry.date}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Image placeholder */}
            <div className="hidden lg:block">
              <div className="bg-card rounded-3xl overflow-hidden shadow-2xl h-[600px] flex items-center justify-center">
                <img
                  src="/placeholder.svg"
                  alt="Decorative"
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Summary view for Last 14 Days */}
          {selectedDate && selectedEntry && (
            <div className="mt-12 bg-background rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-heading font-bold text-secondary">
                  Last {timePeriod} Days
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExport}
                  className="w-12 h-12"
                >
                  <Upload className="w-6 h-6 text-secondary" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <StatusIndicator status={selectedEntry.status} size="lg" />
                </div>
                <div>
                  <MoodIndicator mood={selectedEntry.mood} size="lg" />
                </div>
                <div>
                  <InteractionTimeline count={selectedEntry.interactions} />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-heading font-bold text-secondary mb-4">
                  Summary
                </h3>
                <div className="space-y-2">
                  <div className="h-1 bg-muted rounded-full" />
                  <div className="h-1 bg-muted rounded-full" />
                  <div className="h-1 bg-muted rounded-full" />
                  <div className="h-1 bg-muted rounded-full" />
                  <div className="h-1 bg-muted rounded-full" />
                  <div className="h-1 bg-muted rounded-full" />
                  <p className="text-lg text-foreground mt-4">
                    {selectedEntry.summary}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoryView;
