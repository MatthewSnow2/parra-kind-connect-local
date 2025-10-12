import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const PageTransition = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-accent/10 animate-fade-in" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-accent animate-slide-right" />
    </div>
  );
};

export default PageTransition;
