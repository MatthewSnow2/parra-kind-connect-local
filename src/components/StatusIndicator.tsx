interface StatusIndicatorProps {
  status: "ok" | "warning" | "alert";
  size?: "sm" | "md" | "lg";
}

const StatusIndicator = ({ status, size = "md" }: StatusIndicatorProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  const statusColors = {
    ok: "bg-primary",
    warning: "bg-yellow-400",
    alert: "bg-accent"
  };

  return (
    <div className={`${sizeClasses[size]} ${statusColors[status]} rounded-full shadow-md`} />
  );
};

export default StatusIndicator;
