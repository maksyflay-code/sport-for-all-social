import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle, Mail, RefreshCw, ChevronDown, ChevronRight, Trash2, ShieldCheck, Search } from "lucide-react";

interface DomainStat {
  domain: string;
  total_users: number;
  confirmed_users: number;
  active_users: number;
  rejection_rate: number;
  activation_rate: number;
  is_suspicious: boolean;
  last_signup: string;
}

interface DomainUser {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  confirmed: boolean;
  has_activity: boolean;
  created_at: string;
}

const EmailDomainsAdmin = () => {
  const [stats, setStats] = useState<DomainStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [usersByDomain, setUsersByDomain] = useState<Record<string, DomainUser[]>>({});
  const [loadingDomain, setLoadingDomain] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [onlySuspicious, setOnlySuspicious] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_email_domain_stats");
    if (error) {
      toast.error("Erro ao carregar estatísticas: " + error.message);
    } else {
      setStats((data || []).map((d: any) => ({
        ...d,
        total_users: Number(d.total_users),
        confirmed_users: Number(d.confirmed_users),
        active_users: Number(d.active_users),
        rejection_rate: Number(d.rejection_rate) || 0,
        activation_rate: Number(d.activation_rate) || 0,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (domain: string) => {
    if (expanded === domain) { setExpanded(null); return; }
    setExpanded(domain);
    if (usersByDomain[domain]) return;

    setLoadingDomain(domain);
    const { data, error } = await (supabase as any).rpc("get_users_by_email_domain", { _domain: domain });
    if (error) toast.error("Erro ao carregar usuários: " + error.message);
    else setUsersByDomain((prev) => ({ ...prev, [domain]: data || [] }));
    setLoadingDomain(null);
  };

  const removeUser = async (userId: string, domain: string) => {
    if (!window.confirm("Remover este usuário e todos os dados dele?")) return;
    await Promise.all([
      supabase.from("likes").delete().eq("user_id", userId),
      supabase.from("comments").delete().eq("user_id", userId),
      supabase.from("community_members").delete().eq("user_id", userId),
      supabase.from("community_posts").delete().eq("user_id", userId),
    ]);
    await supabase.from("posts").delete().eq("user_id", userId);
    await supabase.from("follows").delete().eq("follower_id", userId);
    await supabase.from("follows").delete().eq("following_id", userId);
    await supabase.from("notifications").delete().eq("user_id", userId);
    await supabase.from("notifications").delete().eq("actor_id", userId);
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("user_id", userId);

    toast.success("Usuário removido");
    setUsersByDomain((prev) => ({
      ...prev,
      [domain]: (prev[domain] || []).filter((u) => u.user_id !== userId),
    }));
    load();
  };

  const filtered = stats.filter((s) => {
    if (onlySuspicious && !s.is_suspicious) return false;
    if (filter && !s.domain.includes(filter.toLowerCase())) return false;
    return true;
  });

  // KPIs gerais
  const totalUsers = stats.reduce((a, s) => a + s.total_users, 0);
  const totalSuspicious = stats.filter((s) => s.is_suspicious).reduce((a, s) => a + s.total_users, 0);
  const avgRejection = stats.length
    ? Math.round(stats.reduce((a, s) => a + s.rejection_rate * s.total_users, 0) / Math.max(totalUsers, 1) * 10) / 10
    : 0;
  const avgActivation = stats.length
    ? Math.round(stats.reduce((a, s) => a + s.activation_rate * s.total_users, 0) / Math.max(totalUsers, 1) * 10) / 10
    : 0;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-2xl shadow-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Domínios</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{stats.length}</p>
        </div>
        <div className="bg-card rounded-2xl shadow-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Usuários totais</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{totalUsers}</p>
        </div>
        <div className="bg-card rounded-2xl shadow-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Em domínios suspeitos</p>
          <p className="text-2xl font-extrabold text-destructive mt-1">{totalSuspicious}</p>
        </div>
        <div className="bg-card rounded-2xl shadow-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Ativação média</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{avgActivation}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Rejeição: {avgRejection}%</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por domínio..."
            className="rounded-xl pl-9"
          />
        </div>
        <Button
          variant={onlySuspicious ? "default" : "outline"}
          onClick={() => setOnlySuspicious(!onlySuspicious)}
          className="rounded-xl gap-2"
        >
          <AlertTriangle className="w-4 h-4" /> Só suspeitos
        </Button>
        <Button variant="outline" onClick={load} disabled={loading} className="rounded-xl gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="grid grid-cols-[1fr_70px_70px_90px_90px_40px] gap-2 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
          <div>Domínio</div>
          <div className="text-right">Total</div>
          <div className="text-right">Confirm.</div>
          <div className="text-right">Ativação</div>
          <div className="text-right">Rejeição</div>
          <div></div>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum domínio encontrado</div>
        )}

        {filtered.map((s) => (
          <div key={s.domain} className="border-b border-border last:border-b-0">
            <button
              onClick={() => toggleExpand(s.domain)}
              className="w-full grid grid-cols-[1fr_70px_70px_90px_90px_40px] gap-2 px-4 py-3 items-center hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                {expanded === s.domain ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">@{s.domain}</span>
                {s.is_suspicious && (
                  <span className="text-[9px] font-bold uppercase text-destructive bg-destructive/10 px-1.5 py-0.5 rounded shrink-0">
                    Suspeito
                  </span>
                )}
              </div>
              <div className="text-right text-sm font-semibold text-foreground">{s.total_users}</div>
              <div className="text-right text-sm text-muted-foreground">{s.confirmed_users}</div>
              <div className="text-right">
                <span className={`text-sm font-semibold ${s.activation_rate >= 50 ? "text-green-500" : s.activation_rate >= 20 ? "text-yellow-500" : "text-destructive"}`}>
                  {s.activation_rate}%
                </span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-semibold ${s.rejection_rate <= 20 ? "text-green-500" : s.rejection_rate <= 50 ? "text-yellow-500" : "text-destructive"}`}>
                  {s.rejection_rate}%
                </span>
              </div>
              <div></div>
            </button>

            {expanded === s.domain && (
              <div className="bg-muted/30 px-4 py-3 space-y-1.5 border-t border-border">
                {loadingDomain === s.domain && (
                  <p className="text-xs text-muted-foreground py-2">Carregando usuários...</p>
                )}
                {(usersByDomain[s.domain] || []).map((u) => (
                  <div key={u.user_id} className="flex items-center gap-2 bg-card rounded-xl p-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-primary">
                          {(u.display_name || u.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {u.display_name || "Sem nome"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {u.confirmed ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                          <ShieldCheck className="w-2.5 h-2.5" /> Confirm.
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                          Pendente
                        </span>
                      )}
                      {!u.has_activity && (
                        <span className="text-[9px] font-bold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          Inativo
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); removeUser(u.user_id, s.domain); }}
                      className="rounded-lg h-7 w-7 text-destructive hover:bg-destructive/10"
                      title="Remover usuário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {!loadingDomain && (usersByDomain[s.domain] || []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">Nenhum usuário</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailDomainsAdmin;
