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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Atletas</h1>
          <span className="text-sm text-muted-foreground">({profiles.length} cadastrados)</span>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou modalidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full bg-card border-border"
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Carregando atletas...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Nenhum atleta encontrado.</p>
        ) : (
          <div className="grid gap-3">
            {filtered.map((p) => (
              <button
                key={p.user_id}
                onClick={() => navigate(`/usuario/${p.user_id}`)}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all text-left w-full"
              >
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-primary">
                      {p.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{p.display_name || "Anônimo"}</p>
                  {p.bio && <p className="text-xs text-muted-foreground truncate mt-0.5">{p.bio}</p>}
                  {p.sports?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.sports.slice(0, 3).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent text-accent-foreground">
                          {s}
                        </span>
                      ))}
                      {p.sports.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{p.sports.length - 3}</span>
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
