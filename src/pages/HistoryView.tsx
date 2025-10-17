import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StatusIndicator from "@/components/StatusIndicator";
import InteractionTimeline from "@/components/InteractionTimeline";
import MoodIndicator from "@/components/MoodIndicator";
import HistoryDetailModal from "@/components/HistoryDetailModal";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import historyImage from "@/assets/history-image.png";

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
  const { user } = useAuth();

  // Use the authenticated user's ID as the patient ID
  const patientId = user?.id;

  // Fetch daily summaries
  const { data: summaries, isLoading } = useQuery({
    queryKey: ["daily-summaries", patientId, timePeriod],
    queryFn: async () => {
      if (!patientId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timePeriod);

      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("patient_id", patientId)
        .gte("summary_date", startDate.toISOString().split('T')[0])
        .order("summary_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
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
      <div className="min-h-screen bg-[#C9EBC0] flex flex-col">
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

  // List view with modal
  return (
    <div className="min-h-screen bg-[#C9EBC0] flex flex-col">
      {/* Custom Header */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-secondary z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold text-secondary">parra</h1>
          <HamburgerMenu />
        </div>
      </header>

      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: Time period selector and date list */}
            <div>
              {/* QA: UI/UX fix 2025-10-15 - Restructured header layout to prevent export button from being covered by image */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-5xl font-heading font-bold text-secondary">
                    Independent History
                  </h1>
                </div>
                <div className="flex items-center justify-between">
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
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleExport}
                    className="gap-2 border-secondary"
                  >
                    <Upload className="h-5 w-5" />
                    Export
                  </Button>
                </div>
              </div>

              {/* QA: UI/UX fix 2025-10-15 - Increased spacing from 16px to 20px between cards per design spec */}
              <div className="space-y-5">
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
            {/* QA: UI/UX fix 2025-10-15 - Replaced placeholder with uploaded history image per user request */}
            <div className="hidden lg:block">
              <div className="bg-card rounded-3xl overflow-hidden shadow-2xl h-[600px] flex items-center justify-center">
                <img
                  src={historyImage}
                  alt="Two people walking together on a peaceful path, representing companionship and care"
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
            </div>
          </div>

        </div>

        {/* History Detail Modal */}
        <HistoryDetailModal
          entry={selectedEntry}
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          onExport={handleExport}
        />
      </main>
    </div>
  );
};

export default HistoryView;
