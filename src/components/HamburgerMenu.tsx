import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, profile, signOut, isSenior, isCaregiver, isFamilyMember, isAdmin } = useAuth();

  // Build menu items based on user role
  const getMenuItems = () => {
    const publicItems = [
      { label: "Home", path: "/" },
      { label: "Features", path: "/features" },
      { label: "About", path: "/about" },
    ];

    if (!isAuthenticated) {
      return [
        ...publicItems,
        { label: "Privacy Policy", path: "/privacy" },
        { label: "Terms of Service", path: "/terms" },
      ];
    }

    const protectedItems = [...publicItems];

    // Senior-specific items
    if (isSenior) {
      protectedItems.push(
        { label: "My Dashboard", path: "/senior/dashboard" },
        { label: "Chat with Parra", path: "/senior/chat" },
        { label: "My History", path: "/senior/history" }
      );
    }

    // Caregiver/Family/Admin items
    if (isCaregiver || isFamilyMember || isAdmin) {
      protectedItems.push(
        { label: "Caregiver Dashboard", path: "/dashboard" },
        { label: "Patient History", path: "/dashboard/history" }
      );
    }

    return protectedItems;
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
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

          {/* User Info (if authenticated) */}
          {isAuthenticated && profile && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                  <User className="h-5 w-5 text-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {profile.display_name || profile.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto">
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
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="lg"
                className="w-full text-lg"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-lg"
                  onClick={() => {
                    setOpen(false);
                    navigate("/login");
                  }}
                >
                  Sign In
                </Button>
                <Button
                  size="lg"
                  className="w-full text-lg bg-accent hover:bg-accent/90"
                  onClick={() => {
                    setOpen(false);
                    navigate("/signup");
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
