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

const SPORTS_OPTIONS = [
  "Natação Adaptada", "Basquete em Cadeira", "Futebol de Cegos",
  "Atletismo Paralímpico", "Tênis de Mesa", "Goalball",
  "Vôlei Sentado", "Rugby em Cadeira", "Esgrima", "Corrida Inclusiva",
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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();

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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-[680px]">
        {/* Cover + Avatar */}
        <div className="bg-card rounded-lg shadow-card overflow-hidden mb-4">
          <div className="h-[200px] bg-gradient-to-r from-primary/30 to-primary/10 relative">
            <div className="absolute -bottom-[40px] left-6">
              <div className="relative">
                <div className="w-[120px] h-[120px] rounded-full bg-card border-4 border-card flex items-center justify-center overflow-hidden shadow-elevated">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-muted-foreground">
                      {displayName?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-secondary flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors border-2 border-card">
                  <Camera className="w-4 h-4 text-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
            </div>
          </div>
          <div className="pt-14 pb-4 px-6">
            <h2 className="text-2xl font-bold text-foreground">{displayName || "Seu nome"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {uploading && <p className="text-xs text-primary mt-1">Fazendo upload...</p>}
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-card rounded-lg shadow-card p-6 space-y-5">
          <h3 className="text-xl font-bold text-foreground">Editar perfil</h3>

          <div>
            <Label className="text-[13px] font-semibold text-muted-foreground">Nome de exibição</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Como quer ser chamado?" className="mt-1" />
          </div>

          <div>
            <Label className="text-[13px] font-semibold text-muted-foreground">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sobre você e sua relação com o esporte..." rows={3} className="mt-1 resize-none" />
          </div>

          <div>
            <Label className="text-[13px] font-semibold text-muted-foreground mb-2 block">Modalidades Esportivas</Label>
            <div className="flex flex-wrap gap-2">
              {SPORTS_OPTIONS.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => toggleSport(sport)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                    sports.includes(sport)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[13px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Trophy className="w-4 h-4" /> Conquistas
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                placeholder="Ex: 1km na natação adaptada"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
              />
              <Button type="button" variant="outline" onClick={addAchievement} className="shrink-0">+</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[13px] font-medium">
                  <Medal className="w-3 h-3" /> {a}
                  <button onClick={() => setAchievements((prev) => prev.filter((_, j) => j !== i))} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                </span>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground font-bold rounded-lg h-10 gap-2">
            <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
