import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import FindMasterPage from "./pages/FindMaster";
import CategoriesPage from "./pages/Categories";
import MasterProfilePage from "./pages/MasterProfile";
import OrderCreatePage from "./pages/OrderCreate";
import ClientDashboard from "./pages/ClientDashboard";
import MasterDashboard from "./pages/MasterDashboard";
import MastersPage from "./pages/Masters";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<LoginPage />} />
              <Route path="/find-master" element={<FindMasterPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/master/:id" element={<MasterProfilePage />} />
              <Route path="/order/create" element={<OrderCreatePage />} />
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              <Route path="/dashboard/master" element={<MasterDashboard />} />
              <Route path="/masters" element={<MastersPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
