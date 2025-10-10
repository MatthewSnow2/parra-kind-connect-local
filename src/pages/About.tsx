import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";

const About = () => {
  const team = [
    {
      name: "Jennifer",
      role: "Branding & Accessibility Design",
      emoji: "👩‍🎨"
    },
    {
      name: "Louisa",
      role: "UX Copy & Onboarding Flow",
      emoji: "👩‍💻"
    },
    {
      name: "Matthew",
      role: "Backend Systems & AI Voice Logic",
      emoji: "👨‍💼"
    },
    {
      name: "Saima",
      role: "Clinical Operations & User Research",
      emoji: "👩‍⚕️"
    },
    {
      name: "Zakaria",
      role: "AI Engineering & Integration",
      emoji: "👨‍💻"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Heart className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Designed by families, for families.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We believe in helping seniors stay independent through empathy-driven AI
            </p>
          </div>

          <Card className="p-12 mb-12 animate-fade-in">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto text-center">
              Parra Connect was born from a simple truth: caring for loved ones shouldn't require complicated technology. 
              We're building tools that honor independence while providing peace of mind — because everyone deserves 
              to age with dignity, connection, and the support they need.
            </p>
          </Card>

          <div className="mb-12 animate-fade-in">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-8 text-center">
              Meet Our Team
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {team.map((member, index) => (
                <Card 
                  key={index}
                  className="p-6 text-center hover:shadow-lg transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-6xl mb-4">{member.emoji}</div>
                  <h3 className="font-heading font-bold text-foreground mb-2">
                    {member.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {member.role}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
