import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Home, Users, Calendar, Bookmark, Trophy, Settings, HelpCircle } from "lucide-react";
import logoCidadelas from "@/assets/logo-cidadelas.jpeg";

const menuItems = [
  { icon: Home, label: "Feed", href: "#feed" },
  { icon: Users, label: "Comunidades", href: "#comunidades" },
  { icon: Calendar, label: "Eventos", href: "#eventos" },
  { icon: Bookmark, label: "Salvos", href: "#" },
  { icon: Trophy, label: "Conquistas", href: "#" },
  { icon: HelpCircle, label: "Ajuda", href: "#" },
  { icon: Settings, label: "Configurações", href: "#" },
];

const LeftSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-4 pr-2">
      {user && (
        <button
          onClick={() => navigate("/perfil")}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors w-full text-left mb-1"
        >
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            <span className="text-sm font-bold text-primary-foreground">
              {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <span className="text-[15px] font-semibold text-foreground truncate">
            {user.user_metadata?.full_name || user.email?.split("@")[0] || "Meu Perfil"}
          </span>
        </button>
      )}

      <nav className="space-y-0.5">
        {menuItems.map(({ icon: Icon, label, href }) => (
          <a
            key={label}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-[15px] font-medium text-foreground"
          >
            <Icon className="w-5 h-5 text-primary" />
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-4 px-3">
        <p className="text-xs text-muted-foreground">
          © 2026 Cidadelas 360 · Inclusão no Esporte
        </p>
      </div>
    </aside>
  );
};

export default LeftSidebar;
