import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";
import { MessageCircle, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center pt-20 pb-12" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Stay Connected. Stay Independent.
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-foreground leading-tight">
              Caring made simple — no devices, no downloads, just connection.
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Para Connect helps families support independent seniors and adults with disabilities through conversational AI check-ins, fall alerts, and wellness updates — all through familiar tools like WhatsApp and voice assistants.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                🌿 Try Free Beta
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 group">
                <MessageCircle className="mr-2 h-5 w-5 group-hover:text-primary transition-colors" />
                Chat with Para on WhatsApp
              </Button>
            </div>
          </div>
          
          <div className="relative animate-fade-in">
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl"></div>
            <img 
              src={heroImage} 
              alt="Senior using smartphone to stay connected with Para Connect"
              className="relative rounded-3xl shadow-2xl w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
