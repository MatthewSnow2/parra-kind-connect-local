import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero1.jpg";
import { BetaSignupDialog } from "@/components/BetaSignupDialog";

const Hero = () => {
  return (
    <section
      // QA: UI/UX fix 2025-10-15 - Increased top padding by 300px minimum for better text visibility
      className="pt-80 pb-8 md:pt-96 md:pb-12"
      // QA: UI/UX fix 2025-10-15 - Changed background to white (#ffffff) per design spec
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
          {/* Left side - Text content */}
          <div className="space-y-4 md:space-y-5">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-tight"
              style={{ color: '#2F4733' }}
            >
              Live Independently,
              <br />
              Stay connected.
            </h1>

            {/* QA: UI/UX fix 2025-10-15 - Removed tagline "Care that balances safety and autonomy" per design spec */}

            <BetaSignupDialog>
              <Button
                size="lg"
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full"
                style={{ backgroundColor: '#FF6B6B', color: 'white' }}
              >
                Try Free Beta
              </Button>
            </BetaSignupDialog>
          </div>

          {/* Right side - Image */}
          <div className="relative">
            <img
              src={heroImage}
              alt="Elderly people enjoying independence outdoors"
              className="rounded-2xl md:rounded-3xl w-full h-auto object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
