import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BetaSignupDialog } from "@/components/BetaSignupDialog";

const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-10"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
            Connect with Para — the caregiving companion that listens.
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Start your free beta today and experience peace of mind through simple, conversational care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <BetaSignupDialog>
              <Button size="lg" className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all">
                Join the Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </BetaSignupDialog>
            <Button size="lg" variant="outline" className="text-lg px-10 py-6">
              For Families & Caregivers
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            🌿 No credit card required • 🔒 Privacy-first • 💚 Free beta access
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
