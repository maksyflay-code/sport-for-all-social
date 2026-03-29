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
import { motion } from "framer-motion";
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
    if (error) {
      toast.error("Erro ao fazer upload");
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploading(false);
  };

  const toggleSport = (sport: string) => {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
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
      .update({
        display_name: displayName,
        bio,
        sports,
        achievements,
        avatar_url: avatarUrl,
      })
      .eq("user_id", user!.id);

    if (error) toast.error("Erro ao salvar");
    else toast.success("Perfil atualizado! 🎉");
    setSaving(false);
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-8 shadow-card border border-border"
        >
          <h2 className="text-3xl font-display text-foreground mb-6">MEU PERFIL</h2>

          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">
                    {displayName?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                <Camera className="w-4 h-4 text-primary-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <p className="font-semibold text-foreground">{displayName || "Seu nome"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {uploading && <p className="text-xs text-primary">Fazendo upload...</p>}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label>Nome de exibição</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Como quer ser chamado?" />
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sobre você e sua relação com o esporte..." rows={3} />
            </div>

            {/* Sports */}
            <div>
              <Label className="mb-3 block">Modalidades Esportivas</Label>
              <div className="flex flex-wrap gap-2">
                {SPORTS_OPTIONS.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      sports.includes(sport)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <Label className="mb-3 block flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" /> Conquistas
              </Label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  placeholder="Ex: 1km na natação adaptada"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
                />
                <Button type="button" variant="outline" onClick={addAchievement}>+</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {achievements.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-sm">
                    <Medal className="w-3 h-3" /> {a}
                    <button onClick={() => setAchievements((prev) => prev.filter((_, j) => j !== i))} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gradient-hero text-primary-foreground font-semibold gap-2">
              <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
