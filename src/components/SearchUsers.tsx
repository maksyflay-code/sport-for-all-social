import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchResult {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  sports: string[] | null;
}

const SearchUsers = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, bio, sports")
        .ilike("display_name", `%${query.trim()}%`)
        .limit(10);
      setResults(data || []);
      setOpen(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (userId: string) => {
    setQuery("");
    setOpen(false);
    navigate(`/usuario/${userId}`);
  };

  return (
    <div className="relative" ref={ref}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Buscar pessoas..."
        className="pl-10 pr-8 h-10 bg-white/5 border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus-visible:ring-orange-400/30"
      />
      {query && (
        <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
          <X className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e1e3a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-white/30 text-center py-4">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-4">Nenhum resultado para "{query}"</p>
          ) : (
            results.map((r) => (
              <button
                key={r.user_id}
                onClick={() => handleSelect(r.user_id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-orange-400">
                      {r.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.display_name || "Anônimo"}</p>
                  {r.sports && r.sports.length > 0 && (
                    <p className="text-xs text-white/40 truncate">{r.sports.slice(0, 3).join(", ")}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchUsers;
