import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import MyNetwork from "./pages/MyNetwork.tsx";
import Communities from "./pages/Communities.tsx";
import Athletes from "./pages/Athletes.tsx";
import CommunityDetail from "./pages/CommunityDetail.tsx";
import { ConversationsList, ChatView } from "./pages/Messages.tsx";
import Tag from "./pages/Tag.tsx";
import Events from "./pages/Events.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const RECOVERY_REDIRECT_ORIGIN = "https://cidadelas360.com.br";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
};

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/perfil" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
            <Route path="/usuario/:userId" element={<RequireAuth><UserProfile /></RequireAuth>} />
            <Route path="/rede" element={<RequireAuth><MyNetwork /></RequireAuth>} />
            <Route path="/atletas" element={<RequireAuth><Athletes /></RequireAuth>} />
            <Route path="/mensagens" element={<RequireAuth><ConversationsList /></RequireAuth>} />
            <Route path="/comunidades" element={<RequireAuth><Communities /></RequireAuth>} />
            <Route path="/comunidades/:communityId" element={<RequireAuth><CommunityDetail /></RequireAuth>} />
            <Route path="/mensagens/:conversationId" element={<RequireAuth><ChatView /></RequireAuth>} />
            <Route path="/tag/:tagName" element={<RequireAuth><Tag /></RequireAuth>} />
            <Route path="/eventos" element={<RequireAuth><Events /></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
