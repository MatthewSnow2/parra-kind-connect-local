/**
 * AdminLayout Component
 *
 * Main layout wrapper for admin pages providing consistent structure,
 * navigation, breadcrumbs, and user info header.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminNavigation } from './AdminNavigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Settings, Home } from 'lucide-react';
import { getInitials } from '@/lib/admin/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

/**
 * AdminLayout Component
 *
 * Provides consistent admin layout with:
 * - Sidebar navigation
 * - Top header with user menu
 * - Breadcrumb navigation
 * - Page title and description
 * - Responsive design
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  description,
  breadcrumbs = [],
}) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out of the admin panel.',
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const userInitials = getInitials(profile?.full_name || null);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
      >
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Para Connect Admin Dashboard Home"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white"
                style={{ backgroundColor: '#2F4733' }}
                aria-hidden="true"
              >
                P
              </div>
              <span className="text-lg font-heading font-bold" style={{ color: '#2F4733' }}>
                Para Connect Admin
              </span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden md:flex"
            >
              <Link to="/" aria-label="Go to main site">
                <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                Main Site
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="User menu"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback style={{ backgroundColor: '#C9EBC0', color: '#2F4733' }}>
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside
          className="hidden lg:block w-64 border-r min-h-[calc(100vh-4rem)] bg-background sticky top-16"
          role="navigation"
          aria-label="Admin sidebar navigation"
        >
          <div className="p-4">
            <AdminNavigation />
          </div>
        </aside>

        {/* Main Content */}
        <main
          className="flex-1 min-h-[calc(100vh-4rem)]"
          id="main-content"
          role="main"
          tabIndex={-1}
        >
          <div className="container px-4 py-8">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <Breadcrumb className="mb-4" aria-label="Breadcrumb navigation">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/admin">Admin</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {crumb.href && index < breadcrumbs.length - 1 ? (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}

            {/* Page Header */}
            <div className="mb-8">
              <h1
                className="text-3xl md:text-4xl font-heading font-bold mb-2"
                style={{ color: '#2F4733' }}
              >
                {title}
              </h1>
              {description && (
                <p className="text-lg" style={{ color: 'rgba(47, 71, 51, 0.7)' }}>
                  {description}
                </p>
              )}
            </div>

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="p-2">
          <AdminNavigation className="flex flex-row overflow-x-auto space-x-2 space-y-0" />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
