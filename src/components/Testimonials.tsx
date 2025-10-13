import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const Testimonials = () => {
  return (
    <section className="py-8 md:py-12" style={{ backgroundColor: '#2F4733' }}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
            What Real Families Say
          </h2>
        </div>

        <div className="max-w-xl mx-auto">
          <Card
            className="p-6 md:p-8 rounded-2xl md:rounded-3xl"
            style={{ backgroundColor: 'white' }}
          >
            <div className="space-y-3 md:space-y-4">
              <p className="font-heading font-bold text-base md:text-lg" style={{ color: '#FF6B6B' }}>
                Emma L.
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-5 w-5 md:h-6 md:w-6 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: '#2F4733' }}>
                I didn't have to install anything new. Para just works through WhatsApp. It keeps us connected in a way that feels natural.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
