import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from '@/components/PageTransition';

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load page components - this splits them into separate chunks
// Public pages - can be loaded on demand
const Index = lazy(() => import('./pages/Index'));
const Features = lazy(() => import('./pages/Features'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Auth pages - preload these since they're commonly accessed
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

// Protected pages - lazy load since they require authentication
const CaregiverDashboard = lazy(() => import('./pages/CaregiverDashboard'));
const SeniorView = lazy(() => import('./pages/SeniorView'));
const SeniorChat = lazy(() => import('./pages/SeniorChat'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const HistoryView = lazy(() => import('./pages/HistoryView'));

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce refetch frequency for better performance
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTransition />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/features" element={<Features />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Senior Routes */}
              <Route
                path="/senior"
                element={
                  <ProtectedRoute requiredRole="senior">
                    <SeniorView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/senior/chat"
                element={
                  <ProtectedRoute requiredRole="senior">
                    <SeniorChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/senior/dashboard"
                element={
                  <ProtectedRoute requiredRole="senior">
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/senior/history"
                element={
                  <ProtectedRoute requiredRole="senior">
                    <HistoryView />
                  </ProtectedRoute>
                }
              />

              {/* Protected Caregiver Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole={['caregiver', 'family_member', 'admin']}>
                    <CaregiverDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/history"
                element={
                  <ProtectedRoute requiredRole={['caregiver', 'family_member', 'admin']}>
                    <HistoryView />
                  </ProtectedRoute>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;