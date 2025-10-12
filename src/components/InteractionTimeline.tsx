import { MessageCircle } from "lucide-react";

interface InteractionTimelineProps {
  count: number;
}

const InteractionTimeline = ({ count = 5 }: InteractionTimelineProps) => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`flex items-center ${index < count - 1 ? "after:content-[''] after:h-0.5 after:w-12 after:bg-secondary after:ml-2" : ""}`}
        >
          <MessageCircle
            className={`${index === 0 ? "fill-secondary text-secondary" : "fill-transparent text-secondary"} w-10 h-10`}
            strokeWidth={2}
          />
        </div>
      ))}
    </div>
  );
};

export default InteractionTimeline;
