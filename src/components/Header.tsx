import { useState } from "react";
import { Menu, X, Search, Bell, LogOut, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logoCidadelas from "@/assets/logo.jpeg";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 glass border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logoCidadelas} alt="Cidadelas 360" className="w-9 h-9 rounded-xl object-cover" />
          <span className="text-lg font-extrabold tracking-tight text-foreground hidden sm:block">
            Cidadelas <span className="text-primary">360</span>
          </span>
        </a>

        {/* Search */}
        <div className="hidden md:block flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pessoas, comunidades, eventos..."
              className="pl-10 h-10 bg-secondary border-0 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary w-10 h-10">
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary w-10 h-10"
                onClick={() => navigate("/perfil")}
              >
                <User className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-secondary w-10 h-10"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 h-10 px-5">
              Entrar
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-card border-t border-border"
          >
            <nav className="flex flex-col p-3 gap-1">
              <div className="relative mb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-10 h-10 bg-secondary border-0 rounded-xl text-sm" />
              </div>
              {user ? (
                <>
                  <button
                    onClick={() => { navigate("/perfil"); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground hover:bg-secondary transition-colors text-sm font-medium"
                  >
                    <User className="w-5 h-5 text-primary" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-secondary transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Sair
                  </button>
                </>
              ) : (
                <Button onClick={() => { navigate("/auth"); setMobileOpen(false); }} className="bg-primary text-primary-foreground font-semibold rounded-xl mt-1">
                  Entrar
                </Button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
