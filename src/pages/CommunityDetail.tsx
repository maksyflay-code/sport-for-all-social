import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Users, Send, Heart, Trash2, LogIn, Image } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommunityDetail {
  id: string;
  name: string;
  description: string | null;
  sport: string;
  emoji: string;
  created_by: string;
  member_count: number;
  is_member: boolean;
}

interface CommunityPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

const CommunityDetail = () => {
  const { communityId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (communityId) loadAll();
  }, [communityId, user]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadCommunity(), loadPosts(), loadMembers()]);
    setLoading(false);
  };

  const loadCommunity = async () => {
    const { data } = await supabase
      .from("communities")
      .select("*")
      .eq("id", communityId)
      .single();
    if (!data) return;

    const { count } = await supabase
      .from("community_members")
      .select("id", { count: "exact", head: true })
      .eq("community_id", communityId);

    let isMember = false;
    if (user) {
      const { data: mem } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .maybeSingle();
      isMember = !!mem;
    }

    setCommunity({ ...data, member_count: count || 0, is_member: isMember } as any);
  };

  const loadPosts = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) return;

    // Load profiles for post authors
    const userIds = [...new Set(data.map((p: any) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

    setPosts(
      data.map((p: any) => ({
        ...p,
        profile: profileMap[p.user_id] || null,
      }))
    );
  };

  const loadMembers = async () => {
    const { data } = await supabase
      .from("community_members")
      .select("user_id, role, joined_at")
      .eq("community_id", communityId);

    if (!data || data.length === 0) { setMembers([]); return; }

    const userIds = data.map((m: any) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

    setMembers(
      data.map((m: any) => ({
        ...m,
        profile: profileMap[m.user_id] || null,
      }))
    );
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user || !communityId) return;
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      community_id: communityId,
      user_id: user.id,
      content: newPost.trim(),
    } as any);
    if (error) {
      toast.error("Erro ao publicar. Verifique se você é membro.");
    } else {
      setNewPost("");
      await loadPosts();
    }
    setPosting(false);
  };

  const handleJoin = async () => {
    if (!user || !communityId) return;
    await supabase.from("community_members").insert({
      community_id: communityId,
      user_id: user.id,
    } as any);
    toast.success("Você entrou na comunidade!");
    await loadAll();
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from("community_posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e]">
        <Header />
        <p className="text-center text-white/30 py-20">Carregando...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#1a1a2e]">
        <Header />
        <p className="text-center text-white/30 py-20">Comunidade não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
        {/* Back + Community header */}
        <div>
          <button onClick={() => navigate("/comunidades")} className="text-white/40 hover:text-white text-sm flex items-center gap-1 mb-3">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <div className="flex items-start gap-4">
              <span className="text-4xl">{community.emoji}</span>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-white">{community.name}</h1>
                <p className="text-xs text-orange-400/70 font-medium">{community.sport}</p>
                {community.description && (
                  <p className="text-sm text-white/50 mt-1">{community.description}</p>
                )}
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className="text-xs text-white/30 mt-2 flex items-center gap-1 hover:text-white/50 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" /> {community.member_count} {community.member_count === 1 ? "membro" : "membros"}
                </button>
              </div>
              {!community.is_member && user && (
                <Button onClick={handleJoin} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-9 text-sm gap-1">
                  <LogIn className="w-4 h-4" /> Entrar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Members panel */}
        {showMembers && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
            <h3 className="text-sm font-bold text-white mb-2">Membros</h3>
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-white/5 rounded-xl px-2 transition-colors"
                onClick={() => navigate(`/usuario/${m.user_id}`)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={m.profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-orange-500/20 text-orange-400 text-xs">
                    {(m.profile?.display_name || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-white/80 flex-1">{m.profile?.display_name || "Usuário"}</span>
                {m.role === "admin" && (
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">Admin</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post creation - only for members */}
        {community.is_member && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <textarea
              placeholder="Compartilhe algo com a comunidade..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="w-full bg-transparent text-white text-sm placeholder:text-white/30 resize-none outline-none min-h-[80px]"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-white/20">{newPost.length}/1000</span>
              <Button
                onClick={handlePost}
                disabled={!newPost.trim() || posting}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-8 text-xs gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Publicar
              </Button>
            </div>
          </div>
        )}

        {!community.is_member && user && (
          <p className="text-center text-white/30 text-sm py-4">Entre na comunidade para publicar e interagir.</p>
        )}

        {/* Feed */}
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-center text-white/20 text-sm py-8">Nenhuma publicação ainda. Seja o primeiro!</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-start gap-3">
                  <Avatar
                    className="w-9 h-9 cursor-pointer"
                    onClick={() => navigate(`/usuario/${post.user_id}`)}
                  >
                    <AvatarImage src={post.profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-orange-500/20 text-orange-400 text-xs">
                      {(post.profile?.display_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold text-white cursor-pointer hover:text-orange-400 transition-colors"
                        onClick={() => navigate(`/usuario/${post.user_id}`)}
                      >
                        {post.profile?.display_name || "Usuário"}
                      </span>
                      <span className="text-xs text-white/20">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{post.content}</p>
                  </div>
                  {user?.id === post.user_id && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-white/20 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
