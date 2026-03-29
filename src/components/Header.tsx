import { useState } from "react";
import { Menu, X, Search, Home, Users, Calendar, Bell, MessageCircle, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logoCidadelas from "@/assets/logo-cidadelas.jpeg";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-card shadow-card">
      <div className="container mx-auto flex items-center justify-between h-14 px-4 gap-2">
        {/* Left: Logo + Search */}
        <div className="flex items-center gap-2 shrink-0">
          <a href="/" className="flex items-center gap-1.5">
            <img src={logoCidadelas} alt="Cidadelas 360" className="w-10 h-10 rounded-full object-cover" />
          </a>
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar no Cidadelas 360"
              className="pl-9 h-10 w-[240px] bg-secondary border-0 rounded-full text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Center: Navigation tabs */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {[
            { icon: Home, label: "Início", href: "/" },
            { icon: Users, label: "Comunidades", href: "#comunidades" },
            { icon: Calendar, label: "Eventos", href: "#eventos" },
          ].map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center justify-center w-24 h-12 rounded-lg text-muted-foreground hover:bg-secondary transition-colors group relative"
              title={label}
            >
              <Icon className="w-6 h-6 group-hover:text-primary transition-colors" />
            </a>
          ))}
        </nav>

        {/* Right: User actions */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="rounded-full bg-secondary text-foreground hover:bg-secondary/80 w-10 h-10">
                <MessageCircle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full bg-secondary text-foreground hover:bg-secondary/80 w-10 h-10">
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-secondary text-foreground hover:bg-secondary/80 w-10 h-10"
                onClick={() => navigate("/perfil")}
              >
                <User className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-secondary text-foreground hover:bg-secondary/80 w-10 h-10"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 h-9 px-4">
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
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
              {[
                { icon: Home, label: "Início", href: "/" },
                { icon: Users, label: "Comunidades", href: "#comunidades" },
                { icon: Calendar, label: "Eventos", href: "#eventos" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-secondary transition-colors text-[15px] font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-5 h-5 text-primary" />
                  {label}
                </a>
              ))}
              <div className="border-t border-border my-2" />
              {user ? (
                <>
                  <button
                    onClick={() => { navigate("/perfil"); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-secondary transition-colors text-[15px] font-medium"
                  >
                    <User className="w-5 h-5 text-primary" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-secondary transition-colors text-[15px] font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Sair
                  </button>
                </>
              ) : (
                <Button onClick={() => { navigate("/auth"); setMobileOpen(false); }} className="bg-primary text-primary-foreground font-semibold mt-1">
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
