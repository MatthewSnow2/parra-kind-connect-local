import happyIcon from "@/assets/mood/happy.jpg";
import mehIcon from "@/assets/mood/meh.jpg";
import sadIcon from "@/assets/mood/sad.jpg";

interface MoodIndicatorProps {
  mood: "happy" | "neutral" | "sad" | "concerned";
  size?: "sm" | "md" | "lg";
}

const MoodIndicator = ({ mood, size = "md" }: MoodIndicatorProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32"
  };

  const moodImages = {
    happy: happyIcon,
    neutral: mehIcon,
    sad: sadIcon,
    concerned: sadIcon
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-secondary bg-background`}>
      <img
        src={moodImages[mood]}
        alt={`${mood} mood`}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default MoodIndicator;
