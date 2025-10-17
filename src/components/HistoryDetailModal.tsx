import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import StatusIndicator from "@/components/StatusIndicator";
import MoodIndicator from "@/components/MoodIndicator";
import InteractionTimeline from "@/components/InteractionTimeline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HistoryEntry {
  date: string;
  status: "ok" | "warning" | "alert";
  mood: "happy" | "neutral" | "sad" | "concerned";
  interactions: number;
  summary: string;
  highlights?: string[];
  concerns?: string[];
}

interface HistoryDetailModalProps {
  entry: HistoryEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
}

const HistoryDetailModal = ({ entry, isOpen, onClose, onExport }: HistoryDetailModalProps) => {
  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header with date and upload icon */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-secondary pb-4">
          <div>
            <DialogTitle className="text-3xl font-heading font-bold text-secondary">
              {entry.date}
            </DialogTitle>
            <DialogDescription>
              View detailed history including status, mood, interactions, and daily summary
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            className="w-10 h-10"
            aria-label="Export history entry"
          >
            <Upload className="w-5 h-5 text-secondary" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
          {/* Left Column: Progress Bars */}
          <div className="space-y-8">
            {/* Status */}
            <div>
              <h3 className="text-xl font-heading font-bold text-secondary mb-3">
                Status
              </h3>
              <div className="flex items-center gap-4">
                <StatusIndicator status={entry.status} size="md" />
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div
                    className={`h-full rounded-full ${
                      entry.status === "ok"
                        ? "bg-primary w-full"
                        : entry.status === "warning"
                        ? "bg-yellow-400 w-2/3"
                        : "bg-accent w-1/3"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Mood */}
            <div>
              <h3 className="text-xl font-heading font-bold text-secondary mb-3">
                Mood
              </h3>
              <div className="flex items-center gap-4">
                <MoodIndicator mood={entry.mood} size="md" />
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div
                    className={`h-full rounded-full ${
                      entry.mood === "happy"
                        ? "bg-primary w-full"
                        : entry.mood === "neutral"
                        ? "bg-yellow-400 w-2/3"
                        : "bg-accent w-1/3"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Interactions */}
            <div>
              <h3 className="text-xl font-heading font-bold text-secondary mb-3">
                Interactions
              </h3>
              <div className="flex items-center gap-4">
                <InteractionTimeline count={Math.min(entry.interactions, 5)} />
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min((entry.interactions / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div>
            <h3 className="text-xl font-heading font-bold text-secondary mb-3">
              Summary
            </h3>
            <div className="space-y-2">
              {/* Decorative lines representing summary text */}
              <div className="h-1 bg-muted rounded-full" />
              <div className="h-1 bg-muted rounded-full" />
              <div className="h-1 bg-muted rounded-full w-4/5" />
              <div className="h-1 bg-muted rounded-full" />
              <div className="h-1 bg-muted rounded-full w-3/4" />
              <div className="h-1 bg-muted rounded-full" />

              <p className="text-base text-foreground pt-4 leading-relaxed">
                {entry.summary}
              </p>
            </div>

            {/* Highlights */}
            {entry.highlights && entry.highlights.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-heading font-bold text-primary mb-2">
                  Highlights
                </h4>
                <ul className="space-y-1">
                  {entry.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {entry.concerns && entry.concerns.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-heading font-bold text-accent mb-2">
                  Concerns
                </h4>
                <ul className="space-y-1">
                  {entry.concerns.map((concern, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-accent mt-0.5">⚠</span>
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryDetailModal;
