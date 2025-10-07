import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Shield, Bell, MessageSquare, Activity, Phone, Lock, TrendingUp } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Fall Detection (No Wearables)",
      description: "AI detects possible falls based on phone motion and inactivity patterns."
    },
    {
      icon: MessageSquare,
      title: "Conversational Check-ins",
      description: "Natural WhatsApp or voice-based dialogues for mood, medication, and activity."
    },
    {
      icon: Activity,
      title: "Color-Coded Dashboard",
      description: "Simple green/yellow/red indicators for easy status visibility."
    },
    {
      icon: TrendingUp,
      title: "Mood Insights",
      description: "AI analyzes tone and emoji use to infer emotional well-being."
    },
    {
      icon: Bell,
      title: "Family Alerts",
      description: "Instant WhatsApp notifications for urgent events."
    },
    {
      icon: Phone,
      title: "Voice Assistant Integration",
      description: "Alexa and Google Assistant check-in support."
    },
    {
      icon: Lock,
      title: "Privacy Control",
      description: "No video or audio monitoring. Data encrypted end-to-end."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Smart caregiving — without the gadgets.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All the features you need to keep your loved ones safe and connected
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-8 hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Features;
