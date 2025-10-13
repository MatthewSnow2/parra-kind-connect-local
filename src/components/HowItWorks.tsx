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
    <section className="py-8 md:py-10" style={{ backgroundColor: '#C8E6C9' }}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold" style={{ color: '#2F4733' }}>
            How It Works
          </h2>
        </div>

        <div className="grid gap-4 md:gap-5 max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="p-4 md:p-5 rounded-2xl"
              style={{ backgroundColor: '#2F4733' }}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl font-bold shrink-0"
                  style={{ backgroundColor: '#FF6B6B', color: 'white' }}
                >
                  {step.number}
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-heading font-semibold text-white leading-snug">
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
