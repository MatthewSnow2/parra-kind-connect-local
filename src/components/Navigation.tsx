import { Link } from "react-router-dom";
import parraLogo from "@/assets/parra-logo.png";
import HamburgerMenu from "@/components/HamburgerMenu";

const Navigation = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-secondary shadow-md">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={parraLogo}
              alt="Parra"
              className="h-10 w-10 transition-transform group-hover:scale-105"
            />
            <span className="text-2xl font-heading font-bold text-background">parra</span>
          </Link>

          {/* Right: Hamburger Menu */}
          <HamburgerMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
