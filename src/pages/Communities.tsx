import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunities } from "@/hooks/useCommunities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, LogIn, LogOut, Crown } from "lucide-react";
import { toast } from "sonner";

const SPORT_OPTIONS = [
  { name: "Futebol", emoji: "⚽" },
  { name: "Basquete", emoji: "🏀" },
  { name: "Natação", emoji: "🏊" },
  { name: "Vôlei", emoji: "🏐" },
  { name: "Tênis", emoji: "🎾" },
  { name: "Corrida", emoji: "🏃" },
  { name: "Ciclismo", emoji: "🚴" },
  { name: "Artes Marciais", emoji: "🥋" },
  { name: "Surfe", emoji: "🏄" },
  { name: "Musculação", emoji: "🏋️" },
  { name: "Skate", emoji: "🛹" },
  { name: "Handbol", emoji: "🤾" },
];

const Communities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { communities, loading, join, leave, create } = useCommunities();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSport, setNewSport] = useState(SPORT_OPTIONS[0].name);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const selectedEmoji = SPORT_OPTIONS.find((s) => s.name === newSport)?.emoji || "🏅";

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Nome é obrigatório"); return; }
    const err = await create({ name: newName.trim(), description: newDesc.trim(), sport: newSport, emoji: selectedEmoji });
    if (err) { toast.error("Erro ao criar comunidade"); return; }
    toast.success("Comunidade criada!");
    setShowCreate(false);
    setNewName("");
    setNewDesc("");
  };

  const filtered = communities.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchSport = !filterSport || c.sport === filterSport;
    return matchSearch && matchSport;
  });

  const myCommunities = filtered.filter((c) => c.is_member);
  const otherCommunities = filtered.filter((c) => !c.is_member);

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Title + Create */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" /> Comunidades
          </h1>
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> Criar
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white">Nova Comunidade</h3>
            <Input
              placeholder="Nome da comunidade"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-white/5 border-white/10 text-white rounded-xl"
              maxLength={60}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="bg-white/5 border-white/10 text-white rounded-xl"
              maxLength={200}
            />
            <div>
              <p className="text-xs text-white/50 mb-2">Esporte</p>
              <div className="flex flex-wrap gap-2">
                {SPORT_OPTIONS.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setNewSport(s.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      newSport === s.name
                        ? "bg-orange-500 text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-9 text-sm flex-1">
                Criar Comunidade
              </Button>
              <Button onClick={() => setShowCreate(false)} variant="ghost" className="text-white/50 rounded-xl h-9 text-sm">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Buscar comunidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white rounded-xl h-9 text-sm"
            />
          </div>
          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="bg-white/5 border border-white/10 text-white/70 rounded-xl h-9 px-3 text-sm appearance-none cursor-pointer"
          >
            <option value="">Todos</option>
            {SPORT_OPTIONS.map((s) => (
              <option key={s.name} value={s.name}>{s.emoji} {s.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-white/30 text-sm py-8">Carregando...</p>
        ) : (
          <>
            {/* My Communities */}
            {myCommunities.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">Minhas Comunidades</h2>
                {myCommunities.map((c) => (
                  <CommunityCard key={c.id} community={c} onLeave={() => leave(c.id)} isMember />
                ))}
              </div>
            )}

            {/* Discover */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">
                {myCommunities.length > 0 ? "Descobrir" : "Comunidades"}
              </h2>
              {otherCommunities.length > 0 ? (
                otherCommunities.map((c) => (
                  <CommunityCard key={c.id} community={c} onJoin={() => join(c.id)} />
                ))
              ) : (
                communities.length === 0 && (
                  <p className="text-center text-white/30 text-sm py-8">Nenhuma comunidade ainda. Seja o primeiro a criar!</p>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CommunityCard = ({
  community,
  onJoin,
  onLeave,
  isMember = false,
}: {
  community: any;
  onJoin?: () => void;
  onLeave?: () => void;
  isMember?: boolean;
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-orange-400/20 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{community.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white truncate">{community.name}</h3>
            {community.created_by === community.user_id && (
              <Crown className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            )}
          </div>
          <p className="text-xs text-orange-400/70 font-medium">{community.sport}</p>
          {community.description && (
            <p className="text-xs text-white/40 mt-1 line-clamp-2">{community.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-white/30 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {community.member_count} {community.member_count === 1 ? "membro" : "membros"}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          {isMember ? (
            <Button
              onClick={onLeave}
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-8 text-xs gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </Button>
          ) : (
            <Button
              onClick={onJoin}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-8 text-xs gap-1"
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Communities;
