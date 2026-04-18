import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useSuggestedUsers } from "@/hooks/useFollows";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Calendar, UserPlus, UserCheck, Trophy, Activity, ArrowRight, Cake, BarChart3, Circle } from "lucide-react";
import { toast } from "sonner";

interface TopAthlete {
  user_id: string;
  total_km: number;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface ActiveStory {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AnniversaryUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  years: number;
}

interface WeekStats {
  posts: number;
  newUsers: number;
  events: number;
}

const formatEventDate = (s: string) => {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const RightSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { events } = useEvents();
  const suggested = useSuggestedUsers();
  const onlineUsers = useOnlinePresence();
  const [topAthletes, setTopAthletes] = useState<TopAthlete[]>([]);
  const [activeStories, setActiveStories] = useState<ActiveStory[]>([]);
  const [anniversaries, setAnniversaries] = useState<AnniversaryUser[]>([]);
  const [weekStats, setWeekStats] = useState<WeekStats>({ posts: 0, newUsers: 0, events: 0 });
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Top atletas por km Strava
      const { data: dist } = await supabase
        .from("strava_distance")
        .select("user_id, total_km")
        .order("total_km", { ascending: false })
        .limit(5);
      if (dist && dist.length > 0) {
        const ids = dist.map((d: any) => d.user_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, is_verified")
          .in("user_id", ids);
        const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
        setTopAthletes(
          dist.map((d: any) => ({
            user_id: d.user_id,
            total_km: Number(d.total_km),
            display_name: profMap.get(d.user_id)?.display_name ?? null,
            avatar_url: profMap.get(d.user_id)?.avatar_url ?? null,
            is_verified: profMap.get(d.user_id)?.is_verified ?? false,
          }))
        );
      }

      // Stories ativos (distintos por user)
      const { data: stories } = await supabase
        .from("stories")
        .select("user_id, created_at")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (stories && stories.length > 0) {
        const seen = new Set<string>();
        const uniqueIds: string[] = [];
        stories.forEach((s: any) => {
          if (!seen.has(s.user_id)) { seen.add(s.user_id); uniqueIds.push(s.user_id); }
        });
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", uniqueIds.slice(0, 8));
        const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
        setActiveStories(
          uniqueIds.slice(0, 8).map((uid) => ({
            user_id: uid,
            display_name: profMap.get(uid)?.display_name ?? null,
            avatar_url: profMap.get(uid)?.avatar_url ?? null,
          }))
        );
      }

      // Aniversariantes (perfis criados há ≥1 ano no mesmo dia/mês de hoje)
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const { data: allProfs } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, created_at");
      if (allProfs) {
        const annivs = allProfs
          .filter((p: any) => {
            const c = new Date(p.created_at);
            const cmm = String(c.getMonth() + 1).padStart(2, "0");
            const cdd = String(c.getDate()).padStart(2, "0");
            const years = today.getFullYear() - c.getFullYear();
            return cmm === mm && cdd === dd && years >= 1;
          })
          .map((p: any) => ({
            user_id: p.user_id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            years: today.getFullYear() - new Date(p.created_at).getFullYear(),
          }))
          .slice(0, 4);
        setAnniversaries(annivs);
      }

      // Atividade da semana (últimos 7 dias)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [{ count: pCount }, { count: uCount }, { count: eCount }] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("events").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      ]);
      setWeekStats({ posts: pCount || 0, newUsers: uCount || 0, events: eCount || 0 });
    })();
  }, []);

  const handleFollow = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setLoadingId(targetId);
    if (followedIds.has(targetId)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setFollowedIds((prev) => { const n = new Set(prev); n.delete(targetId); return n; });
      toast.success("Deixou de seguir");
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId } as any);
      setFollowedIds((prev) => new Set(prev).add(targetId));
      toast.success("Seguindo!");
    }
    setLoadingId(null);
  };

  const upcoming = events.slice(0, 3);

  return (
    <aside className="space-y-4">
      {/* Quem está online agora */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
          <Circle className="w-2.5 h-2.5 text-green-400 fill-green-400 animate-pulse" />
          Online agora
          <span className="ml-auto text-[10px] font-semibold text-green-400">
            {onlineUsers.length}
          </span>
        </h3>
        {onlineUsers.length === 0 ? (
          <p className="text-[11px] text-white/30 text-center py-2">
            Ninguém mais online no momento
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {onlineUsers.slice(0, 8).map((u) => (
              <button
                key={u.user_id}
                onClick={() => navigate(`/usuario/${u.user_id}`)}
                className="w-full flex items-center gap-2 group text-left"
              >
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-orange-400">
                        {u.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-[#1a1a2e]" />
                </div>
                <p className="text-xs font-semibold text-white truncate flex-1 group-hover:text-orange-400">
                  {u.display_name || "Anônimo"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Próximos eventos */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-400" /> Próximos eventos
          </h3>
          <button
            onClick={() => navigate("/eventos")}
            className="text-[10px] font-semibold text-orange-400 hover:text-orange-300"
          >
            Ver todos
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-[11px] text-white/30 text-center py-2">Nenhum evento próximo</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((ev) => (
              <button
                key={ev.id}
                onClick={() => navigate("/eventos")}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
              >
                <span className="text-lg shrink-0">{ev.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-orange-400">{ev.title}</p>
                  <p className="text-[10px] text-white/40">
                    {formatEventDate(ev.event_date)}
                    {ev.location && ` • ${ev.location}`}
                  </p>
                </div>
                <ArrowRight className="w-3 h-3 text-orange-400/50 group-hover:text-orange-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sugestões para seguir */}
      {suggested.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
            <UserPlus className="w-3.5 h-3.5 text-orange-400" /> Sugestões para seguir
          </h3>
          <div className="space-y-2">
            {suggested.slice(0, 4).map((p) => (
              <div
                key={p.user_id}
                onClick={() => navigate(`/usuario/${p.user_id}`)}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold text-orange-400">
                      {p.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-white truncate flex-1 group-hover:text-orange-400">
                  {p.display_name || "Anônimo"}
                </p>
                <button
                  onClick={(e) => handleFollow(p.user_id, e)}
                  disabled={loadingId === p.user_id}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    followedIds.has(p.user_id)
                      ? "bg-white/10 text-orange-400"
                      : "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                  }`}
                >
                  {followedIds.has(p.user_id) ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top atletas (km Strava) */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
          <Trophy className="w-3.5 h-3.5 text-orange-400" /> Top atletas (km)
        </h3>
        {topAthletes.length === 0 ? (
          <p className="text-[11px] text-white/30 text-center py-2">
            Conecte o Strava para entrar no ranking!
          </p>
        ) : (
          <div className="space-y-2">
            {topAthletes.map((a, idx) => (
              <button
                key={a.user_id}
                onClick={() => navigate(`/usuario/${a.user_id}`)}
                className="w-full flex items-center gap-2 group text-left"
              >
                <span className={`text-[11px] font-black w-4 text-center ${
                  idx === 0 ? "text-yellow-400" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-orange-300" : "text-white/30"
                }`}>
                  {idx + 1}
                </span>
                <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-orange-400">
                      {a.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-white truncate flex-1 group-hover:text-orange-400 flex items-center gap-1">
                  {a.display_name || "Anônimo"}
                  <VerifiedBadge verified={a.is_verified} size="sm" />
                </p>
                <span className="text-[10px] font-bold text-orange-400 shrink-0">
                  {a.total_km.toFixed(1)} km
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stories ativos */}
      {activeStories.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
            <Activity className="w-3.5 h-3.5 text-orange-400" /> Stories ativos
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {activeStories.map((s) => (
              <button
                key={s.user_id}
                onClick={() => navigate(`/usuario/${s.user_id}`)}
                className="text-center group"
                title={s.display_name || "Anônimo"}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-[#1a1a2e] flex items-center justify-center overflow-hidden">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-xs font-bold text-orange-400">
                        {s.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-white/50 truncate mt-1 group-hover:text-orange-400">
                  {s.display_name?.split(" ")[0] || "—"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aniversariantes */}
      {anniversaries.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
            <Cake className="w-3.5 h-3.5 text-orange-400" /> Aniversariantes
          </h3>
          <div className="space-y-2">
            {anniversaries.map((a) => (
              <button
                key={a.user_id}
                onClick={() => navigate(`/usuario/${a.user_id}`)}
                className="w-full flex items-center gap-2 group text-left"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold text-orange-400">
                      {a.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-orange-400">
                    {a.display_name || "Anônimo"}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {a.years} {a.years === 1 ? "ano" : "anos"} na rede 🎉
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Atividade da semana */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-orange-400" /> Atividade da semana
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">📝 Posts</span>
            <span className="font-bold text-orange-400">{weekStats.posts}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">👥 Novos atletas</span>
            <span className="font-bold text-orange-400">{weekStats.newUsers}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">📅 Eventos</span>
            <span className="font-bold text-orange-400">{weekStats.events}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
