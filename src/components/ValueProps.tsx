import { Card } from "@/components/ui/card";
import { Scale, Lock, MessageCircle } from "lucide-react";

const ValueProps = () => {
  return (
    <section className="py-16" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="container mx-auto px-4">
        {/* Introduction text */}
        <div className="text-center mb-12">
          <p className="text-lg max-w-4xl mx-auto leading-relaxed" style={{ color: '#2F4733' }}>
            Parra is a caregiving companion built for dignity and ease. It's designed to help independent seniors and caregivers stay connected, simply and independently, through gentle, conversational AI. Parra offers "no alarms required" technology through familiar tools like WhatsApp.
          </p>
        </div>

        {/* Three feature cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1 - Open Conversation */}
          <Card
            className="p-6 rounded-3xl"
            style={{ backgroundColor: '#2F4733' }}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <Scale className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">
                Open Conversation
              </h3>
              <p className="text-sm text-white opacity-90 leading-relaxed">
                Parra chats casually, just using natural text. No special commands, No awkward voice interfaces, just conversation.
              </p>
            </div>
          </Card>

          {/* Card 2 - Personal Space */}
          <Card
            className="p-6 rounded-3xl"
            style={{ backgroundColor: '#2F4733' }}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">
                Personal Space
              </h3>
              <p className="text-sm text-white opacity-90 leading-relaxed">
                Everything stays in the user's space. No forced check-ins, just a respectful AI assistant.
              </p>
            </div>
          </Card>

          {/* Card 3 - Gentle Updates */}
          <Card
            className="p-6 rounded-3xl"
            style={{ backgroundColor: '#2F4733' }}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">
                Gentle Updates
              </h3>
              <p className="text-sm text-white opacity-90 leading-relaxed">
                Parra summarizes patterns for caregivers, nothing intrusive, just peace of mind.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
