import { Card } from "@/components/ui/card";

const Testimonials = () => {
  return (
    <section className="py-16" style={{ backgroundColor: '#2F4733' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            What Real Families Say
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card
            className="p-8 rounded-3xl"
            style={{ backgroundColor: 'white' }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">👩</div>
                <div>
                  <p className="font-heading font-bold text-lg" style={{ color: '#FF6B6B' }}>
                    Emma L.
                  </p>
                  <p className="text-sm text-gray-600">
                    Independent Adult
                  </p>
                </div>
              </div>
              <p className="text-lg leading-relaxed" style={{ color: '#2F4733' }}>
                "I didn't have to install anything new. Para just works through WhatsApp. It keeps me connected in a way that feels natural."
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
