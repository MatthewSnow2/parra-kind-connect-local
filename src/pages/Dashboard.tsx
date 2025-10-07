import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Caregiver Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Coming soon — Your family wellness at a glance
            </p>
          </div>
          
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground">
              Dashboard features are currently in development.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
