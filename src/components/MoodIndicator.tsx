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

  const moodEmojis = {
    happy: "😊",
    neutral: "😐",
    sad: "🙁",
    concerned: "😟"
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full border-4 border-secondary flex items-center justify-center text-4xl bg-background`}>
      {moodEmojis[mood]}
    </div>
  );
};

export default MoodIndicator;
