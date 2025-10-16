import { Link, useLocation } from "react-router-dom";
import parraLogo from "@/assets/parra-logo-transparent.png";
import HamburgerMenu from "@/components/HamburgerMenu";

const Navigation = () => {
  const location = useLocation();
  const isActive = location.pathname === "/";

  return (
    <nav
      className="fixed top-0 w-full z-50 bg-secondary shadow-md"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Brand */}
          <Link
            to="/"
            className={`flex items-center gap-3 group transition-all ${
              isActive ? "scale-105" : "hover:scale-105"
            }`}
            aria-label="Parra Connect home page"
            aria-current={isActive ? "page" : undefined}
          >
            <img
              src={parraLogo}
              alt="Parra Connect logo - green parrot illustration"
              className="h-10 w-10 transition-transform"
              width="40"
              height="40"
            />
            {/* QA: UI/UX fix 2025-10-15 - Removed underline from logo on homepage per user request */}
            <span
              className="text-2xl font-heading font-bold transition-all text-background"
              aria-hidden="false"
            >
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
