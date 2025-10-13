import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";
import { BetaSignupDialog } from "@/components/BetaSignupDialog";

const Hero = () => {
  return (
    <section
      className="pt-20 pb-12"
      style={{ backgroundColor: '#C8E6C9' }}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <h1
              className="text-4xl md:text-5xl font-heading font-bold leading-tight"
              style={{ color: '#2F4733' }}
            >
              Live Independently,
              <br />
              Stay connected.
            </h1>

            <p className="text-lg" style={{ color: '#2F4733' }}>
              Care that balances safety and autonomy
            </p>

            <BetaSignupDialog>
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-full"
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
              alt="Senior using smartphone to stay connected"
              className="rounded-3xl w-full"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
