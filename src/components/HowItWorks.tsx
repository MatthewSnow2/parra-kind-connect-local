import { Card } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Those living independently chat with Parra"
    },
    {
      number: "2",
      title: "The dashboard shows caregivers vital information at a glance"
    },
    {
      number: "3",
      title: "Parra's AI detects patterns, and sends alerts if anything seems off"
    }
  ];

  return (
    <section className="py-16" style={{ backgroundColor: '#C8E6C9' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold" style={{ color: '#2F4733' }}>
            How It Works
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="p-6 rounded-3xl"
              style={{ backgroundColor: '#2F4733' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                  style={{ backgroundColor: '#FF6B6B', color: 'white' }}
                >
                  {step.number}
                </div>
                <div>
                  <h3 className="text-base font-heading font-semibold text-white leading-snug">
                    {step.title}
                  </h3>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
