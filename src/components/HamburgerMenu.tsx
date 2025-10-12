import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Patient Chat", path: "/senior" },
    { label: "Patient Dashboard", path: "/senior/dashboard" },
    { label: "Patient History", path: "/senior/history" },
    { label: "Caregiver Dashboard", path: "/dashboard" },
    { label: "Caregiver History", path: "/dashboard/history" },
    { label: "Features", path: "/features" },
    { label: "About", path: "/about" },
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 hover:bg-accent/20"
          aria-label="Open menu"
        >
          {/* Hamburger Icon - 3 coral lines */}
          <div className="flex flex-col gap-1.5">
            <div className="w-6 h-0.5 bg-accent rounded-full" />
            <div className="w-6 h-0.5 bg-accent rounded-full" />
            <div className="w-6 h-0.5 bg-accent rounded-full" />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[300px] sm:w-[400px] bg-background border-l-4 border-accent"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-primary">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Menu
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-10 w-10"
            >
              <X className="h-6 w-6 text-foreground" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 text-lg font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-accent text-background font-bold"
                    : "text-foreground hover:bg-primary hover:text-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-primary space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full text-lg"
            >
              Sign In
            </Button>
            <Button
              size="lg"
              className="w-full text-lg bg-accent hover:bg-accent/90"
            >
              Try Free Beta
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
