import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import SeniorView from "./pages/SeniorView";
import SeniorChat from "./pages/SeniorChat";
import PatientDashboard from "./pages/PatientDashboard";
import HistoryView from "./pages/HistoryView";
import Features from "./pages/Features";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Patient/Senior Routes */}
          <Route path="/senior" element={<SeniorView />} />
          <Route path="/senior/chat" element={<SeniorChat />} />
          <Route path="/senior/dashboard" element={<PatientDashboard />} />
          <Route path="/senior/history" element={<HistoryView />} />

          {/* Caregiver Routes */}
          <Route path="/dashboard" element={<CaregiverDashboard />} />
          <Route path="/dashboard/history" element={<HistoryView />} />

          {/* Info Pages */}
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
