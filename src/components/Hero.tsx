import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";
import { MessageCircle, Sparkles } from "lucide-react";
import { BetaSignupDialog } from "@/components/BetaSignupDialog";

const Hero = () => {
  return (
    <section
      className="min-h-screen flex items-center pt-20 pb-12"
      style={{ background: "var(--gradient-hero)" }}
      aria-labelledby="hero-heading"
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary"
              role="status"
              aria-label="Website tagline"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Stay Connected. Stay Independent.
            </div>

            <h1
              id="hero-heading"
              className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight"
              style={{ color: '#2F4733' }}
            >
              Caring made simple — no devices, no downloads, just connection.
            </h1>

            <p className="text-xl md:text-2xl leading-relaxed" style={{ color: 'rgba(47, 71, 51, 0.7)' }}>
              Parra Connect helps families support independent seniors and adults with disabilities through conversational AI check-ins, fall alerts, and wellness updates — all through familiar tools like WhatsApp and voice assistants.
            </p>

            <div className="flex flex-col sm:flex-row gap-4" role="group" aria-label="Primary actions">
              <BetaSignupDialog>
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                  aria-label="Sign up for free beta access"
                >
                  <span aria-hidden="true">🌿</span> Try Free Beta
                </Button>
              </BetaSignupDialog>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 group"
                asChild
              >
                <a
                  href="https://wa.me/15555555555?text=Hi%20Parra%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20service"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with Parra on WhatsApp - opens in new window"
                >
                  <MessageCircle className="mr-2 h-5 w-5 group-hover:text-primary transition-colors" aria-hidden="true" />
                  Chat with Parra on WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="relative animate-fade-in" role="img" aria-label="Senior using smartphone to stay connected">
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl" aria-hidden="true"></div>
            <img
              src={heroImage}
              alt="Happy senior woman in her 70s sitting comfortably at home, smiling while using a smartphone to connect with her family through Parra Connect. The image shows ease of use and independence."
              className="relative rounded-3xl shadow-2xl w-full"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
