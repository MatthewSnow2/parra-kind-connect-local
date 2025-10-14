import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import SeniorView from "./pages/SeniorView";
import SeniorChat from "./pages/SeniorChat";
import PatientDashboard from "./pages/PatientDashboard";
import HistoryView from "./pages/HistoryView";
import Features from "./pages/Features";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import {
  AdminDashboard,
  AdminUsers,
  AdminCareRelationships,
  AdminAlerts,
  AdminAuditLog,
  AdminSettings,
} from "./pages/admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTransition />
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
            {/* Chat route - accessible to all authenticated users */}
            <Route
              path="/senior/chat"
              element={
                <ProtectedRoute>
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
                <ProtectedRoute requiredRole={["caregiver", "family_member", "admin"]}>
                  <CaregiverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/history"
              element={
                <ProtectedRoute requiredRole={["caregiver", "family_member", "admin"]}>
                  <HistoryView />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/relationships"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCareRelationships />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/alerts"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAlerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-log"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAuditLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
