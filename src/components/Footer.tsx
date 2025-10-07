import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Heart className="h-8 w-8" />
              <span className="text-2xl font-heading font-bold">Parra Connect</span>
            </Link>
            <p className="text-secondary-foreground/80">
              Caring made simple through conversational AI
            </p>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:hello@parraconnect.ai" className="hover:text-primary transition-colors">
                  hello@parraconnect.ai
                </a>
              </li>
              <li className="text-secondary-foreground/80">Support available 24/7</li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 pt-8 text-center">
          <p className="text-secondary-foreground/80">
            Built with ❤️ at the CareConnect Hackathon 2025
          </p>
          <p className="text-sm text-secondary-foreground/60 mt-2">
            © 2025 Parra Connect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
