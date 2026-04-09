import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

const Athletes = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, bio, sports")
      .order("created_at", { ascending: false })
      .limit(100);
    setProfiles(data || []);
    setLoading(false);
  };

  const filtered = profiles.filter((p) =>
    (p.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.sports || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-orange-400" />
          <h1 className="text-xl font-bold text-white">Atletas</h1>
          <span className="text-sm text-white/40">({profiles.length} cadastrados)</span>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Buscar por nome ou modalidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-400/50"
          />
        </div>

        {loading ? (
          <p className="text-sm text-white/30 text-center py-12">Carregando atletas...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-12">Nenhum atleta encontrado.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <button
                key={p.user_id}
                onClick={() => navigate(`/usuario/${p.user_id}`)}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-orange-400/30 hover:bg-white/[0.07] transition-all text-left w-full"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-orange-400">
                      {p.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{p.display_name || "Anônimo"}</p>
                  {p.bio && (
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{p.bio}</p>
                  )}
                  {p.sports?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.sports.slice(0, 3).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {s}
                        </span>
                      ))}
                      {p.sports.length > 3 && (
                        <span className="text-[10px] text-white/30">+{p.sports.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Athletes;
