import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Search, Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logoCidadelas from "@/assets/logo.jpeg";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true } as any)
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markAllRead();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#16162a]/90 glass border-b border-white/5">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logoCidadelas} alt="Cidadelas 360" className="w-10 h-10 rounded-full object-cover shadow-sm" />
          <span className="text-lg font-extrabold tracking-tight text-white hidden sm:block">
            CIDADELAS <span className="text-orange-400">360</span>
          </span>
        </a>

        {/* Search */}
        <div className="hidden md:block flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Buscar pessoas, comunidades, eventos..."
              className="pl-10 h-10 bg-white/5 border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus-visible:ring-orange-400/30"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-white/50 hover:text-white hover:bg-white/10 w-10 h-10 relative"
                  onClick={handleBellClick}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 mt-2 w-80 bg-[#1e1e3a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Notificações</h3>
                        {notifications.length > 0 && (
                          <button onClick={markAllRead} className="text-xs text-orange-400 hover:text-orange-300">
                            Marcar tudo como lido
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-white/30 text-center py-8">Nenhuma notificação</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                                !notif.read ? "bg-orange-500/5" : ""
                              }`}
                              onClick={() => {
                                navigate(`/usuario/${notif.actor_id}`);
                                setShowNotifications(false);
                              }}
                            >
                              <p className="text-sm text-white/80">{notif.message}</p>
                              <p className="text-xs text-white/30 mt-0.5">
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-white/50 hover:text-white hover:bg-white/10 w-10 h-10"
                onClick={() => navigate("/perfil")}
              >
                <User className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-white/50 hover:text-red-400 hover:bg-white/10 w-10 h-10"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold h-10 px-5">
              Entrar
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white"
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
            className="md:hidden overflow-hidden bg-[#16162a] border-t border-white/5"
          >
            <nav className="flex flex-col p-3 gap-1">
              <div className="relative mb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input placeholder="Buscar..." className="pl-10 h-10 bg-white/5 border-white/10 rounded-xl text-sm text-white placeholder:text-white/30" />
              </div>
              {user ? (
                <>
                  <button
                    onClick={() => { handleBellClick(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <Bell className="w-5 h-5 text-orange-400" />
                    Notificações
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </button>
                  <button
                    onClick={() => { navigate("/perfil"); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <User className="w-5 h-5 text-orange-400" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Sair
                  </button>
                </>
              ) : (
                <Button onClick={() => { navigate("/auth"); setMobileOpen(false); }} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl mt-1">
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
