import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useEvents } from "@/hooks/useEvents";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Users, FileText, Trash2, ShieldCheck, ShieldX, Calendar, Plus, Edit } from "lucide-react";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  isAdmin: boolean;
}

interface PostItem {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profileName: string | null;
}

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const { events, reload: reloadEvents } = useEvents();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"users" | "posts" | "events">("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);

  // New event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventEmoji, setEventEmoji] = useState("🏅");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) { loadUsers(); loadPosts(); }
  }, [isAdmin]);

  const loadUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "admin");
    const adminIds = new Set(roles?.map((r) => r.user_id) || []);
    setUsers(
      (profiles || []).map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        isAdmin: adminIds.has(p.user_id),
      }))
    );
  };

  const loadPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    if (!data) return;
    const userIds = [...new Set(data.map((p) => p.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
    const nameMap: Record<string, string | null> = {};
    profiles?.forEach((p) => { nameMap[p.user_id] = p.display_name; });
    setPosts(data.map((p) => ({ ...p, profileName: nameMap[p.user_id] || "Anônimo" })));
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) toast.error("Erro ao excluir post");
    else { toast.success("Post excluído"); loadPosts(); }
  };

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === user?.id) { toast.error("Você não pode remover seu próprio admin"); return; }
    if (currentlyAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      toast.success("Admin removido");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" } as any);
      toast.success("Admin adicionado");
    }
    loadUsers();
  };

  const removeUser = async (userId: string) => {
    if (userId === user?.id) { toast.error("Você não pode remover a si mesmo"); return; }
    const confirmed = window.confirm("Remover este usuário e todos os seus dados?");
    if (!confirmed) return;

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
    loadUsers();
  };

  const createEvent = async () => {
    if (!eventTitle || !eventDate) { toast.error("Preencha título e data"); return; }
    const { error } = await supabase.from("events").insert({
      title: eventTitle,
      emoji: eventEmoji || "🏅",
      event_date: eventDate,
      location: eventLocation || null,
      created_by: user?.id,
    } as any);
    if (error) { toast.error("Erro ao criar evento"); return; }
    toast.success("Evento criado!");
    setEventTitle(""); setEventEmoji("🏅"); setEventDate(""); setEventLocation("");
    setShowEventForm(false);
    reloadEvents();
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) toast.error("Erro ao excluir evento");
    else { toast.success("Evento excluído"); reloadEvents(); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Painel Admin</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button variant={tab === "users" ? "default" : "outline"} onClick={() => setTab("users")} className="rounded-xl gap-2">
              <Users className="w-4 h-4" /> Usuários ({users.length})
            </Button>
            <Button variant={tab === "posts" ? "default" : "outline"} onClick={() => setTab("posts")} className="rounded-xl gap-2">
              <FileText className="w-4 h-4" /> Posts ({posts.length})
            </Button>
            <Button variant={tab === "events" ? "default" : "outline"} onClick={() => setTab("events")} className="rounded-xl gap-2">
              <Calendar className="w-4 h-4" /> Eventos ({events.length})
            </Button>
          </div>

          {/* Users tab */}
          {tab === "users" && (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.user_id} className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {u.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.display_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.isAdmin && <span className="text-primary font-medium">Admin • </span>}
                      Desde {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAdmin(u.user_id, u.isAdmin)}
                    className={`rounded-xl gap-1.5 text-xs ${u.isAdmin ? "text-destructive hover:text-destructive" : "text-primary hover:text-primary"}`}
                  >
                    {u.isAdmin ? <><ShieldX className="w-4 h-4" /> Remover Admin</> : <><ShieldCheck className="w-4 h-4" /> Tornar Admin</>}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Posts tab */}
          {tab === "posts" && (
            <div className="space-y-2">
              {posts.map((p) => (
                <div key={p.id} className="bg-card rounded-2xl shadow-card p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary">{p.profileName}</p>
                    <p className="text-sm text-foreground mt-1 line-clamp-2">{p.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePost(p.id)}
                    className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Events tab */}
          {tab === "events" && (
            <div className="space-y-4">
              <Button onClick={() => setShowEventForm(!showEventForm)} className="rounded-xl gap-2 bg-primary text-primary-foreground">
                <Plus className="w-4 h-4" /> Novo Evento
              </Button>

              {showEventForm && (
                <div className="bg-card rounded-2xl shadow-card p-5 space-y-3">
                  <h3 className="text-sm font-bold text-foreground">Criar Evento</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Título do evento" className="rounded-xl" />
                    <Input value={eventEmoji} onChange={(e) => setEventEmoji(e.target.value)} placeholder="Emoji (ex: 🏅)" className="rounded-xl" />
                    <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="rounded-xl" />
                    <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Local (opcional)" className="rounded-xl" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createEvent} className="rounded-xl bg-primary text-primary-foreground">Criar</Button>
                    <Button variant="outline" onClick={() => setShowEventForm(false)} className="rounded-xl">Cancelar</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3">
                    <span className="text-2xl">{event.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.event_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEvent(event.id)}
                      className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento cadastrado</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
