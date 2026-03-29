import { useState } from "react";
import { Menu, X, Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import logoCidadelas from "@/assets/logo-cidadelas.jpeg";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = ["Feed", "Comunidades", "Eventos", "Histórias", "Sobre"];

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2">
          <img src={logoCidadelas} alt="Cidadelas 360" className="w-10 h-10 rounded-full object-cover" />
          <span className="font-display text-2xl tracking-wide text-foreground">
            CIDADELAS <span className="text-gradient">360</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <User className="w-5 h-5" />
          </Button>
          <Button className="gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Entrar
          </Button>
        </div>

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
            className="md:hidden overflow-hidden bg-card border-b border-border"
          >
            <nav className="flex flex-col p-4 gap-3">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-semibold text-muted-foreground hover:text-primary py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </a>
              ))}
              <Button className="gradient-hero text-primary-foreground font-semibold mt-2">
                Entrar
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
