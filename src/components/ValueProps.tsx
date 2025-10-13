import { Card } from "@/components/ui/card";
import { Scale, Lock, MessageCircle } from "lucide-react";

const ValueProps = () => {
  return (
    <>
      {/* Dark green intro section */}
      <section className="py-8 md:py-10" style={{ backgroundColor: '#2F4733' }}>
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center">
            <p className="text-base md:text-lg font-bold mb-3 md:mb-4 text-white">
              Parra is a caregiving companion built for dignity and ease.
            </p>
            <p className="text-sm md:text-base text-white leading-relaxed">
              It helps families stay connected to loved ones living independently through gentle, conversational AI. Parra offers "no learning required" technology through familiar tools like WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* Light green cards section */}
      <section className="py-8 md:py-10" style={{ backgroundColor: '#C8E6C9' }}>
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">

        {/* Three feature cards */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {/* Card 1 - Open Connection */}
          <Card
            className="p-5 md:p-6 rounded-2xl"
            style={{ backgroundColor: '#2F4733' }}
          >
            <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
              <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
                <Scale className="h-10 w-10 md:h-12 md:w-12" style={{ color: '#FF6B6B' }} />
              </div>
              <h3 className="text-lg md:text-xl font-heading font-bold text-white">
                Open Connection
              </h3>
              <p className="text-xs md:text-sm text-white opacity-90 leading-relaxed">
                Everyone sees the same summaries. No secret dashboards or one-way monitoring.
              </p>
            </div>
          </Card>

          {/* Card 2 - Personal Space */}
          <Card
            className="p-5 md:p-6 rounded-2xl"
            style={{ backgroundColor: '#2F4733' }}
          >
            <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
              <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
                <Lock className="h-10 w-10 md:h-12 md:w-12" style={{ color: '#FF6B6B' }} />
              </div>
              <h3 className="text-lg md:text-xl font-heading font-bold text-white">
                Personal Space
              </h3>
              <p className="text-xs md:text-sm text-white opacity-90 leading-relaxed">
                Conversations with Parra are private. Like a diary that listens, not a system that watches.
              </p>
            </div>
          </Card>

          {/* Card 3 - Gentle Updates */}
          <Card
            className="p-5 md:p-6 rounded-2xl"
            style={{ backgroundColor: '#2F4733' }}
          >
            <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
              <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
                <MessageCircle className="h-10 w-10 md:h-12 md:w-12" style={{ color: '#FF6B6B' }} />
              </div>
              <h3 className="text-lg md:text-xl font-heading font-bold text-white">
                Gentle Updates
              </h3>
              <p className="text-xs md:text-sm text-white opacity-90 leading-relaxed">
                Para understands patterns, sharing insights that help families stay aware.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
    </>
  );
};

export default ValueProps;
