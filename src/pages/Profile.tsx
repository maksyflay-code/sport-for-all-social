import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, Save, Trophy, Medal } from "lucide-react";
import { StravaConnectButton } from "@/components/StravaIntegration";

const SPORTS_OPTIONS = [
  "Futebol", "Basquete", "Natação", "Vôlei", "Tênis", "Corrida",
  "Ciclismo", "Artes Marciais", "Musculação", "Surfe", "Skate", "Handbol",
  "Atletismo", "Boxe", "Judô", "Karatê", "Taekwondo", "Esgrima",
  "Ginástica", "Triathlon", "Rugby", "Golfe", "Badminton", "Ping-Pong",
  "CrossFit", "Yoga", "Pilates", "Escalada", "Remo", "Canoagem",
  "Natação Adaptada", "Basquete em Cadeira", "Futebol de Cegos",
  "Atletismo Paralímpico", "Goalball", "Vôlei Sentado",
  "Rugby em Cadeira", "Corrida Inclusiva",
];

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    if (data) {
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setSports(data.sports || []);
      setAchievements(data.achievements || []);
      setAvatarUrl(data.avatar_url);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao fazer upload"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploading(false);
  };

  const toggleSport = (sport: string) => {
    setSports((prev) => prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]);
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements((prev) => [...prev, newAchievement.trim()]);
      setNewAchievement("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio, sports, achievements, avatar_url: avatarUrl })
      .eq("user_id", user!.id);
    if (error) toast.error("Erro ao salvar");
    else toast.success("Perfil atualizado!");
    setSaving(false);
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Avatar + Name */}
        <div className="bg-white/5 rounded-2xl overflow-hidden mb-4 border border-white/5">
          <div className="h-32 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-[#16162a]" />
          <div className="px-6 pb-5 -mt-12">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-2xl bg-[#16162a] border-4 border-[#1a1a2e] flex items-center justify-center overflow-hidden shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white/30">
                    {displayName?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow-lg">
                <Camera className="w-3.5 h-3.5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div className="mt-3">
              <h2 className="text-xl font-bold text-white">{displayName || "Seu nome"}</h2>
              <p className="text-xs text-white/40">{user?.email}</p>
              {uploading && <p className="text-xs text-orange-400 mt-1">Fazendo upload...</p>}
            </div>
          </div>
        </div>

        {/* Strava Connection */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            🏃 Integração Strava
          </h3>
          <p className="text-xs text-white/40 mb-3">Conecte sua conta Strava para compartilhar atividades no feed.</p>
          <StravaConnectButton />
        </div>

        {/* Edit Form */}
        <div className="bg-white/5 rounded-2xl p-6 space-y-5 border border-white/5">
          <h3 className="text-lg font-bold text-white">Editar perfil</h3>

          <div>
            <Label className="text-xs font-semibold text-white/50">Nome de exibição</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Como quer ser chamado?" className="mt-1.5 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-400/50" />
          </div>

          <div>
            <Label className="text-xs font-semibold text-white/50">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sobre você e sua relação com o esporte..." rows={3} className="mt-1.5 resize-none rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-400/50" />
          </div>

          <div>
            <Label className="text-xs font-semibold text-white/50 mb-2 block">Modalidades Esportivas</Label>
            <div className="flex flex-wrap gap-2">
              {SPORTS_OPTIONS.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => toggleSport(sport)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    sports.includes(sport)
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-white/50 mb-2 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Conquistas
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                placeholder="Ex: 1km na natação adaptada"
                className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-400/50"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
              />
              <Button type="button" variant="outline" onClick={addAchievement} className="shrink-0 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10">+</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-300 text-xs font-medium border border-orange-400/20">
                  <Medal className="w-3 h-3" /> {a}
                  <button onClick={() => setAchievements((prev) => prev.filter((_, j) => j !== i))} className="ml-1 text-white/30 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl h-11 gap-2">
            <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
