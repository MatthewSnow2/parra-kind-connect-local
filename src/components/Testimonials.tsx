import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      quote: "My mom hates tech, but she talks to Para like it's a friend.",
      author: "Sarah M.",
      role: "Daughter & Caregiver",
      avatar: "👩"
    },
    {
      quote: "We finally stopped worrying about the nights.",
      author: "David L.",
      role: "Son & Primary Caregiver",
      avatar: "👨"
    },
    {
      quote: "It's like having a caring companion checking in every day.",
      author: "Maria R.",
      role: "Family Caregiver",
      avatar: "👩"
    }
  ];

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            What Families Say
          </h2>
          <p className="text-xl text-muted-foreground">
            Real stories from real caregivers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="p-8 hover:shadow-lg transition-all duration-300 relative animate-fade-in"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                backgroundColor: 'white',
                boxShadow: '0 0 0 2px hsl(108, 52%, 83%)'
              }}
            >
              <Quote className="h-8 w-8 text-primary/20 mb-4" />
              <p className="text-lg text-foreground mb-6 leading-relaxed font-medium">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div>
                  <p className="font-heading font-bold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
