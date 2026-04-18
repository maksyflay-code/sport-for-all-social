import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Search, Bell, LogOut, User, MessageCircle, Users, Shield, UserSearch, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logoCidadelas from "@/assets/logo.jpeg";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import SearchUsers from "@/components/SearchUsers";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setUnreadCount((c) => c + 1);
          toast(newNotif.message, { icon: "🔔" });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          <SearchUsers />
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

              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 w-10 h-10"
                  onClick={() => navigate("/admin")}
                  title="Painel Admin"
                >
                  <Shield className="w-5 h-5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-white/50 hover:text-white hover:bg-white/10 w-10 h-10"
                onClick={() => navigate("/atletas")}
                title="Atletas"
              >
                <UserSearch className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-white/50 hover:text-white hover:bg-white/10 w-10 h-10"
                onClick={() => navigate("/comunidades")}
                title="Comunidades"
              >
                <Users className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-white/50 hover:text-white hover:bg-white/10 w-10 h-10"
                onClick={() => navigate("/eventos")}
                title="Eventos"
              >
                <Calendar className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-white/50 hover:text-white hover:bg-white/10 w-10 h-10"
                onClick={() => navigate("/mensagens")}
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
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
              <div className="mb-2">
                <SearchUsers />
              </div>
              {user ? (
                <>
                  {isAdmin && (
                    <button
                      onClick={() => { navigate("/admin"); setMobileOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-orange-400 hover:bg-orange-500/10 transition-colors text-sm font-bold"
                    >
                      <Shield className="w-5 h-5" />
                      Painel Admin
                    </button>
                  )}
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
                    onClick={() => { navigate("/atletas"); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <UserSearch className="w-5 h-5 text-orange-400" />
                    Atletas
                  </button>
                  <button
                    onClick={() => { navigate("/comunidades"); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <Users className="w-5 h-5 text-orange-400" />
                    Comunidades
                  </button>
                  <button
                    onClick={() => { navigate("/eventos"); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <Calendar className="w-5 h-5 text-orange-400" />
                    Eventos
                  </button>
                  <button
                    onClick={() => { navigate("/mensagens"); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <MessageCircle className="w-5 h-5 text-orange-400" />
                    Mensagens
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
