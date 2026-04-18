import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunities } from "@/hooks/useCommunities";
import { useUserBadges } from "@/hooks/useBadges";
import { supabase } from "@/integrations/supabase/client";
import VerifiedBadge from "@/components/VerifiedBadge";
import {
  Home, Calendar, Users, UserSearch, MessageCircle, User,
  Award, Trophy,
} from "lucide-react";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
}

interface Counts { followers: number; following: number; posts: number }

const navItems = [
  { label: "Início", icon: Home, path: "/" },
  { label: "Eventos", icon: Calendar, path: "/eventos" },
  { label: "Comunidades", icon: Users, path: "/comunidades" },
  { label: "Atletas", icon: UserSearch, path: "/atletas" },
  { label: "Mensagens", icon: MessageCircle, path: "/mensagens" },
  { label: "Minha Rede", icon: Users, path: "/rede" },
  { label: "Meu Perfil", icon: User, path: "/perfil" },
];

const LeftSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { communities } = useCommunities();
  const { badges } = useUserBadges(user?.id);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [counts, setCounts] = useState<Counts>({ followers: 0, following: 0, posts: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: followers }, { count: following }, { count: posts }] = await Promise.all([
        supabase.from("profiles").select("display_name, avatar_url, bio, is_verified").eq("user_id", user.id).maybeSingle(),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (p) setProfile(p as ProfileData);
      setCounts({ followers: followers || 0, following: following || 0, posts: posts || 0 });
    })();
  }, [user]);

  const myCommunities = communities.filter((c) => c.is_member).slice(0, 4);
  const recentBadges = badges.slice(0, 4);

  return (
    <aside className="space-y-4">
      {/* Mini perfil */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
        <button
          onClick={() => navigate("/perfil")}
          className="flex items-center gap-3 w-full text-left group"
        >
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-bold text-orange-400">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate group-hover:text-orange-400 transition-colors flex items-center gap-1">
              {profile?.display_name || "Você"}
              <VerifiedBadge verified={profile?.is_verified} size="sm" />
            </p>
            {profile?.bio && (
              <p className="text-[11px] text-white/40 line-clamp-1">{profile.bio}</p>
            )}
          </div>
        </button>

        <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-white/5">
          <div className="text-center">
            <p className="text-sm font-bold text-white">{counts.posts}</p>
            <p className="text-[10px] text-white/40">Posts</p>
          </div>
          <button
            onClick={() => navigate("/rede")}
            className="text-center hover:bg-white/5 rounded-lg py-0.5 transition-colors"
          >
            <p className="text-sm font-bold text-white">{counts.followers}</p>
            <p className="text-[10px] text-white/40">Seguidores</p>
          </button>
          <button
            onClick={() => navigate("/rede")}
            className="text-center hover:bg-white/5 rounded-lg py-0.5 transition-colors"
          >
            <p className="text-sm font-bold text-white">{counts.following}</p>
            <p className="text-[10px] text-white/40">Seguindo</p>
          </button>
        </div>
      </div>

      {/* Menu */}
      <nav className="bg-white/5 rounded-2xl p-2 border border-white/5">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-orange-500/10 transition-colors"
          >
            <item.icon className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Minhas comunidades */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-400" /> Minhas comunidades
          </h3>
          <button
            onClick={() => navigate("/comunidades")}
            className="text-[10px] font-semibold text-orange-400 hover:text-orange-300"
          >
            Ver todas
          </button>
        </div>
        {myCommunities.length === 0 ? (
          <p className="text-[11px] text-white/30 text-center py-2">
            Você ainda não participa de nenhuma.
          </p>
        ) : (
          <div className="space-y-1.5">
            {myCommunities.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/comunidades/${c.id}`)}
                className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 transition-colors group text-left"
              >
                <span className="text-lg shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-orange-400">
                    {c.name}
                  </p>
                  <p className="text-[10px] text-white/40">{c.member_count} membros</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Badges recentes */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-orange-400" /> Conquistas recentes
          </h3>
          <button
            onClick={() => navigate("/perfil")}
            className="text-[10px] font-semibold text-orange-400 hover:text-orange-300"
          >
            Ver todas
          </button>
        </div>
        {recentBadges.length === 0 ? (
          <p className="text-[11px] text-white/30 text-center py-2 flex items-center gap-1.5 justify-center">
            <Award className="w-3.5 h-3.5" /> Continue postando!
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {recentBadges.map((b) => (
              <div
                key={b.id}
                title={`${b.title} — ${b.description}`}
                className="bg-orange-500/10 border border-orange-400/20 rounded-xl p-2 text-center"
              >
                <div className="text-xl">{b.emoji}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;
