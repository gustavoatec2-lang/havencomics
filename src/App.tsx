import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { initClickCounter } from "@/utils/clickCounter";
import Index from "./pages/Index";
import Catalogo from "./pages/Catalogo";
import VIP from "./pages/VIP";
import Discord from "./pages/Discord";
import Entrar from "./pages/Entrar";
import MangaDetail from "./pages/MangaDetail";
import Reader from "./pages/Reader";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - cache kept in memory
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const App = () => {
  // Initialize click counter for ads every 3 clicks
  useEffect(() => {
    initClickCounter();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/vip" element={<VIP />} />
              <Route path="/discord" element={<Discord />} />
              <Route path="/entrar" element={<Entrar />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/manga/:id" element={<MangaDetail />} />
              <Route path="/manga/:id/ler/:chapter" element={<Reader />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

