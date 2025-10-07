import { Card } from "@/components/ui/card";
import { MessageCircle, Brain, Activity, Bell } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: MessageCircle,
      number: "1",
      title: "Senior chats daily",
      description: "Via WhatsApp → medication, mood, and check-ins"
    },
    {
      icon: Brain,
      number: "2",
      title: "AI monitors patterns",
      description: "Detects missed responses or unusual patterns"
    },
    {
      icon: Activity,
      number: "3",
      title: "Dashboard shows trends",
      description: "Mood and activity trends (green/yellow/red)"
    },
    {
      icon: Bell,
      number: "4",
      title: "Instant alerts",
      description: "Sent to caregivers if something seems off"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to peace of mind
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connection lines */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
          
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="relative p-6 hover:shadow-lg transition-all duration-300 bg-card animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 mx-auto shadow-lg">
                  {step.number}
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 mx-auto">
                  <step.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-lg font-heading font-bold text-center mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-center text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
