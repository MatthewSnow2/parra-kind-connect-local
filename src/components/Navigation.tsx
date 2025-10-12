import { Link, useLocation } from "react-router-dom";
import parraLogo from "@/assets/parra-logo.png";
import HamburgerMenu from "@/components/HamburgerMenu";

const Navigation = () => {
  const location = useLocation();
  const isActive = location.pathname === "/";

  return (
    <nav className="fixed top-0 w-full z-50 bg-secondary shadow-md">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Brand */}
          <Link
            to="/"
            className={`flex items-center gap-3 group transition-all ${
              isActive ? "scale-105" : "hover:scale-105"
            }`}
          >
            <img
              src={parraLogo}
              alt="Parra"
              className="h-10 w-10 transition-transform"
            />
            <span className={`text-2xl font-heading font-bold transition-all ${
              isActive ? "text-background border-b-2 border-background" : "text-background"
            }`}>
              parra
            </span>
          </Link>

          {/* Right: Hamburger Menu */}
          <HamburgerMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
