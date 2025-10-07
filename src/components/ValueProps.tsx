import { Card } from "@/components/ui/card";
import { MessageSquare, Shield, Heart } from "lucide-react";

const ValueProps = () => {
  const values = [
    {
      icon: MessageSquare,
      title: "Conversational Care",
      description: "No apps to learn — seniors chat naturally using WhatsApp or voice assistants.",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Privacy-First AI",
      description: "No cameras or invasive sensors. All data processed locally whenever possible.",
      color: "text-secondary"
    },
    {
      icon: Heart,
      title: "Family Peace of Mind",
      description: "Real-time alerts and weekly insights keep everyone connected and reassured.",
      color: "text-accent"
    }
  ];

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Why Para Connect?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, secure, and centered around what matters most — connection.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6`}>
                <value.icon className={`h-8 w-8 ${value.color}`} />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-foreground">
                {value.title}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
