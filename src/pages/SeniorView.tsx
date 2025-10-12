import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Mic } from "lucide-react";

const SeniorView = () => {
  const navigate = useNavigate();

  const handleTalkClick = () => {
    // TODO: Implement voice chat functionality
    navigate("/senior/chat?mode=talk");
  };

  const handleTypeClick = () => {
    navigate("/senior/chat?mode=type");
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-secondary mb-12 text-center">
            Chat with Parra
          </h1>

          {/* Talk and Type Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Talk Card */}
            <button
              onClick={handleTalkClick}
              className="bg-card rounded-3xl p-12 flex flex-col items-center justify-center gap-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 min-h-[400px]"
            >
              <div className="w-40 h-40 rounded-full border-4 border-secondary flex items-center justify-center">
                <Mic className="w-20 h-20 text-secondary" strokeWidth={2} />
              </div>
              <span className="text-5xl font-heading font-bold text-secondary">
                Talk
              </span>
            </button>

            {/* Type Card */}
            <button
              onClick={handleTypeClick}
              className="bg-card rounded-3xl p-12 flex flex-col items-center justify-center gap-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 min-h-[400px]"
            >
              <div className="w-40 h-40 rounded-full border-4 border-secondary flex items-center justify-center">
                {/* Text cursor icon - using a custom SVG-like representation */}
                <div className="text-secondary text-8xl font-light leading-none" style={{ fontFamily: 'monospace' }}>
                  I
                </div>
              </div>
              <span className="text-5xl font-heading font-bold text-secondary">
                Type
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeniorView;
