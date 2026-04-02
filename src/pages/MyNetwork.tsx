import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, UserMinus, Search, Users, UserCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserItem {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  sports: string[] | null;
  followed_at?: string;
}

const MyNetwork = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) loadUsers();
  }, [user, tab]);

  const loadUsers = async () => {
    if (!user) return;
    setLoading(true);

    const column = tab === "followers" ? "following_id" : "follower_id";
    const selectColumn = tab === "followers" ? "follower_id" : "following_id";

    const { data: follows } = await supabase
      .from("follows")
      .select(`${selectColumn}, created_at`)
      .eq(column, user.id)
      .order("created_at", { ascending: false });

    if (!follows || follows.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const ids = follows.map((f: any) => f[selectColumn]);
    const followDates: Record<string, string> = {};
    follows.forEach((f: any) => { followDates[f[selectColumn]] = f.created_at; });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, bio, sports")
      .in("user_id", ids);

    setUsers(
      (profiles || []).map((p) => ({ ...p, followed_at: followDates[p.user_id] }))
    );
    setLoading(false);
  };

  const unfollow = async (targetId: string) => {
    if (!user) return;
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
    toast.success("Deixou de seguir");
    loadUsers();
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    const { data } = await supabase.rpc("get_or_create_conversation", { other_user_id: otherUserId });
    if (data) navigate(`/mensagens/${data}`);
    else toast.error("Erro ao iniciar conversa");
  };

  const filtered = users.filter((u) =>
    !search || u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" /> Minha Rede
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/5 mb-4">
          <button
            onClick={() => setTab("followers")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === "followers" ? "bg-orange-500 text-white shadow" : "text-white/40 hover:text-white/70"
            }`}
          >
            Seguidores ({tab === "followers" ? users.length : "..."})
          </button>
          <button
            onClick={() => setTab("following")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === "following" ? "bg-orange-500 text-white shadow" : "text-white/40 hover:text-white/70"
            }`}
          >
            Seguindo ({tab === "following" ? users.length : "..."})
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar na lista..."
            className="pl-10 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-white/30 text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/30 text-sm">
              {search ? "Nenhum resultado encontrado" : tab === "followers" ? "Nenhum seguidor ainda" : "Você não segue ninguém ainda"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <div key={u.user_id} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/[0.07] transition-colors">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => navigate(`/usuario/${u.user_id}`)}
                    className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0"
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-orange-400">
                        {u.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate(`/usuario/${u.user_id}`)}
                      className="text-sm font-semibold text-white hover:text-orange-400 transition-colors truncate block text-left"
                    >
                      {u.display_name || "Anônimo"}
                    </button>
                    {u.bio && <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{u.bio}</p>}
                    {u.sports && u.sports.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {u.sports.slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-orange-500/10 text-orange-300 border border-orange-400/20">
                            {s}
                          </span>
                        ))}
                        {u.sports.length > 3 && (
                          <span className="text-[10px] text-white/30">+{u.sports.length - 3}</span>
                        )}
                      </div>
                    )}
                    {u.followed_at && (
                      <p className="text-[10px] text-white/20 mt-1">
                        {tab === "followers" ? "Seguindo você " : "Seguindo "}
                        {formatDistanceToNow(new Date(u.followed_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-xl text-white/40 hover:text-orange-400 hover:bg-white/10 w-9 h-9"
                      onClick={() => startConversation(u.user_id)}
                      title="Enviar mensagem"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    {tab === "following" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 w-9 h-9"
                        onClick={() => unfollow(u.user_id)}
                        title="Deixar de seguir"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyNetwork;
