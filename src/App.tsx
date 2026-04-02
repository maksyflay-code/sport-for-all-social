import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import MyNetwork from "./pages/MyNetwork.tsx";
import Communities from "./pages/Communities.tsx";
import { ConversationsList, ChatView } from "./pages/Messages.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const RECOVERY_REDIRECT_ORIGIN = "https://cidadelas360.com.br";

const RecoveryRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    const isRecoveryLink = hash.includes("type=recovery");

    if (!isRecoveryLink) return;

    if (window.location.origin !== RECOVERY_REDIRECT_ORIGIN) {
      window.location.replace(`${RECOVERY_REDIRECT_ORIGIN}/${hash}`);
      return;
    }

    if (location.pathname !== "/reset-password") {
      navigate({ pathname: "/reset-password", hash }, { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RecoveryRedirectHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/usuario/:userId" element={<UserProfile />} />
            <Route path="/rede" element={<MyNetwork />} />
            <Route path="/mensagens" element={<ConversationsList />} />
            <Route path="/comunidades" element={<Communities />} />
            <Route path="/mensagens/:conversationId" element={<ChatView />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
