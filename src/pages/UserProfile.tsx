import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";
import { useAdmin } from "@/hooks/useAdmin";
import Header from "@/components/Header";
import FollowersModal from "@/components/FollowersModal";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Medal, MessageCircle, Heart, MessageCircle as CommentIcon, MapPin, Calendar, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { isFollowing, followersCount, followingCount, toggleFollow, loading } = useFollows(userId);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState<any[]>([]);
  const [communitiesCount, setCommunitiesCount] = useState(0);

  useEffect(() => {
    if (userId) {
      setProfileLoading(true);
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()
        .then(({ data }) => {
          setProfile(data);
          setProfileLoading(false);
        });
      loadPosts();
      loadCommunitiesCount();
      if (user && user.id !== userId) loadMutualFollowers();
    }
  }, [userId, user]);

  const loadCommunitiesCount = async () => {
    if (!userId) return;
    const { count } = await supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    setCommunitiesCount(count || 0);
  };

  const loadPosts = async () => {
    if (!userId) return;
    setPostsLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      const postIds = data.map((p) => p.id);
      const [{ data: likes }, { data: comments }] = await Promise.all([
        supabase.from("likes").select("post_id, user_id").in("post_id", postIds),
        supabase.from("comments").select("post_id").in("post_id", postIds),
      ]);

      const likesMap: Record<string, { count: number; userLiked: boolean }> = {};
      const commentsMap: Record<string, number> = {};
      likes?.forEach((l) => {
        if (!likesMap[l.post_id]) likesMap[l.post_id] = { count: 0, userLiked: false };
        likesMap[l.post_id].count++;
        if (l.user_id === user?.id) likesMap[l.post_id].userLiked = true;
      });
      comments?.forEach((c) => { commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1; });

      setPosts(data.map((p) => ({
        ...p,
        likes_count: likesMap[p.id]?.count || 0,
        comments_count: commentsMap[p.id] || 0,
        user_liked: likesMap[p.id]?.userLiked || false,
      })));
    } else {
      setPosts([]);
    }
    setPostsLoading(false);
  };

  const loadMutualFollowers = async () => {
    if (!user || !userId) return;
    const [{ data: myFollowing }, { data: theirFollowing }] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
      supabase.from("follows").select("following_id").eq("follower_id", userId),
    ]);
    const myIds = new Set(myFollowing?.map((f) => f.following_id) || []);
    const mutualIds = (theirFollowing?.map((f) => f.following_id) || []).filter((id) => myIds.has(id) && id !== user.id && id !== userId);
    if (mutualIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", mutualIds.slice(0, 5));
      setMutualFollowers(profiles || []);
    }
  };

  const handleFollow = async () => {
    if (!user) { toast.error("Faça login para seguir"); return; }
    await toggleFollow();
    toast.success(isFollowing ? "Deixou de seguir" : "Seguindo!");
  };

  const handleMessage = async () => {
    if (!user) { toast.error("Faça login primeiro"); return; }
    const { data } = await supabase.rpc("get_or_create_conversation", { other_user_id: userId });
    if (data) navigate(`/mensagens/${data}`);
    else toast.error("Erro ao iniciar conversa");
  };

  const handleLike = async (postId: string, userLiked: boolean) => {
    if (!user) { toast.error("Faça login para curtir"); return; }
    if (userLiked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
    }
    loadPosts();
  };

  const handleRemoveUser = async () => {
    if (!isAdmin || !userId) return;
    const confirmed = window.confirm("Remover este usuário e todos os seus dados? Esta ação não pode ser desfeita.");
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
    await supabase.from("profiles").delete().eq("user_id", userId);
    toast.success("Usuário removido com sucesso");
    navigate("/");
  };

  if (profileLoading) return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="flex items-center justify-center h-64">
        <p className="text-white/40">Carregando perfil...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="flex items-center justify-center h-64">
        <p className="text-white/40">Perfil não encontrado.</p>
      </div>
    </div>
  );

  const isOwnProfile = user?.id === userId;
  const memberSince = profile.created_at ? format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR }) : null;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Profile Card */}
        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-orange-500/30 via-orange-400/15 to-white/5" />
          
          <div className="px-6 pb-6 -mt-14">
            {/* Avatar + Actions */}
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-full bg-[#1a1a2e] border-4 border-[#1a1a2e] flex items-center justify-center overflow-hidden shadow-md shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-orange-400">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              {!isOwnProfile && user && (
                <div className="flex gap-2 mb-1">
                  <Button
                    onClick={handleFollow}
                    disabled={loading}
                    size="sm"
                    className={`rounded-full font-semibold gap-1.5 ${
                      isFollowing
                        ? "bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                  >
                    {isFollowing ? <><UserCheck className="w-4 h-4" /> Seguindo</> : <><UserPlus className="w-4 h-4" /> Seguir</>}
                  </Button>
                  <Button
                    onClick={handleMessage}
                    size="sm"
                    className="rounded-full font-semibold gap-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/10"
                  >
                    <MessageCircle className="w-4 h-4" /> Mensagem
                  </Button>
                </div>
              )}
            </div>

            {/* Name & Bio */}
            <div className="mt-3">
              <h1 className="text-xl font-bold text-white">{profile.display_name || "Anônimo"}</h1>
              {profile.bio && <p className="text-sm text-white/50 mt-1 leading-relaxed">{profile.bio}</p>}
              {memberSince && (
                <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Membro desde {memberSince}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-5 mt-4 py-3 border-t border-white/10">
              <button onClick={() => setModalType("followers")} className="text-center hover:opacity-80 transition-opacity">
                <p className="text-lg font-bold text-white">{followersCount}</p>
                <p className="text-xs text-white/40">Seguidores</p>
              </button>
              <button onClick={() => setModalType("following")} className="text-center hover:opacity-80 transition-opacity">
                <p className="text-lg font-bold text-white">{followingCount}</p>
                <p className="text-xs text-white/40">Seguindo</p>
              </button>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{posts.length}</p>
                <p className="text-xs text-white/40">Publicações</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{communitiesCount}</p>
                <p className="text-xs text-white/40">Comunidades</p>
              </div>
            </div>

            {/* Admin button */}
            {isAdmin && !isOwnProfile && (
              <Button
                onClick={handleRemoveUser}
                variant="ghost"
                size="sm"
                className="mt-2 rounded-full text-red-400 hover:bg-red-500/10 gap-1.5 text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover usuário (Admin)
              </Button>
            )}

            {/* Mutual followers */}
            {mutualFollowers.length > 0 && (
              <div className="mt-3 flex items-center gap-2 pt-3 border-t border-white/10">
                <div className="flex -space-x-2">
                  {mutualFollowers.slice(0, 3).map((m) => (
                    <div key={m.user_id} className="w-6 h-6 rounded-full bg-white/10 border-2 border-[#1a1a2e] flex items-center justify-center overflow-hidden">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] font-bold text-orange-400">{m.display_name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-white/40">
                  Seguido por {mutualFollowers[0]?.display_name}{mutualFollowers.length > 1 ? ` e mais ${mutualFollowers.length - 1}` : ""} que você segue
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sports */}
        {profile.sports?.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mt-4">
            <h3 className="text-sm font-bold text-white mb-3">🏅 Modalidades</h3>
            <div className="flex flex-wrap gap-2">
              {profile.sports.map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {profile.achievements?.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mt-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Medal className="w-4 h-4 text-orange-400" /> Conquistas
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.achievements.map((a: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-medium">
                  <Medal className="w-3 h-3" /> {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* No info message */}
        {!profile.bio && (!profile.sports || profile.sports.length === 0) && (!profile.achievements || profile.achievements.length === 0) && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mt-4 text-center">
            <p className="text-sm text-white/40">Este usuário ainda não preencheu as informações do perfil.</p>
          </div>
        )}

        {/* Posts */}
        <div className="mt-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-400" /> Publicações
          </h3>
          {postsLoading ? (
            <p className="text-sm text-white/40 text-center py-8">Carregando...</p>
          ) : posts.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
              <p className="text-sm text-white/40">Nenhuma publicação ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <article key={post.id} className="bg-white/5 rounded-2xl border border-white/10 p-4">
                  <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  {post.location && (
                    <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {post.location}
                    </p>
                  )}
                  {post.image_url && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                      {post.image_url.match(/\.(mp4|webm|mov|avi)/) ? (
                        <video src={post.image_url} className="w-full max-h-72 object-cover" controls />
                      ) : (
                        <img src={post.image_url} alt="" className="w-full max-h-72 object-cover rounded-xl" loading="lazy" />
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                    <button
                      onClick={() => handleLike(post.id, post.user_liked)}
                      className={`flex items-center gap-1 transition-colors ${post.user_liked ? "text-orange-400" : "hover:text-white"}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.user_liked ? "fill-orange-400" : ""}`} />
                      {post.likes_count > 0 && post.likes_count}
                    </button>
                    <span className="flex items-center gap-1">
                      <CommentIcon className="w-3.5 h-3.5" />
                      {post.comments_count > 0 && post.comments_count}
                    </span>
                    <span className="ml-auto">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {userId && modalType && (
        <FollowersModal
          userId={userId}
          type={modalType}
          open={!!modalType}
          onOpenChange={(open) => !open && setModalType(null)}
        />
      )}
    </div>
  );
};

export default UserProfile;
