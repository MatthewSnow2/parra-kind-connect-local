import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import parraLogo from "@/assets/parra-logo.png";
import { BetaSignupDialog } from "@/components/BetaSignupDialog";

const Navigation = () => {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={parraLogo} 
              alt="Parra Care" 
              className="h-12 w-12 transition-transform group-hover:scale-105"
            />
            <span className="text-2xl font-heading font-bold text-foreground">Parra Care</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-foreground hover:text-primary transition-colors font-medium">
              Features
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium">
              About
            </Link>
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors font-medium">
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
            <BetaSignupDialog>
              <Button variant="default" size="lg">
                Try Free Beta
              </Button>
            </BetaSignupDialog>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
