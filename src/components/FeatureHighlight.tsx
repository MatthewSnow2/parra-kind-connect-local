import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import dashboardImage from "@/assets/dashboard-preview.jpg";
import { ArrowRight } from "lucide-react";

const FeatureHighlight = () => {
  return (
    <section className="py-20 bg-secondary/5">
      <div className="container mx-auto px-4">
        <Card className="overflow-hidden border-2 border-primary/20">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-12 flex flex-col justify-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full text-sm font-medium text-secondary mb-6 w-fit">
                ✨ Advanced Fall Detection
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
                Unlike traditional pendant systems, Parra Connect detects falls and inactivity without wearables — even during the night.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our AI-powered system analyzes motion patterns and communication gaps to ensure your loved ones are safe, without invasive monitoring devices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="default">
                  Compare Parra vs. Others
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  See How It Works
                </Button>
              </div>
            </div>
            
            <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 p-8 flex items-center justify-center animate-fade-in">
              <img 
                src={dashboardImage} 
                alt="Parra Connect dashboard showing wellness tracking"
                className="rounded-2xl shadow-2xl w-full max-w-xl"
              />
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default FeatureHighlight;
