import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Send, Image, Smile, X, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StravaActivities } from "@/components/StravaIntegration";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url: string | null;
  location: string | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

const FeedSection = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPosts(); }, [user]);

  const loadPosts = async () => {
    const { data: postsData } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20);
    if (!postsData || postsData.length === 0) { setPosts([]); return; }

    const postIds = postsData.map((p) => p.id);
    const userIds = [...new Set(postsData.map((p) => p.user_id))];

    const [{ data: profilesData }, { data: likesData }, { data: commentsData }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
      supabase.from("likes").select("post_id, user_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
    ]);

    const profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    profilesData?.forEach((p) => { profilesMap[p.user_id] = p; });

    const likesMap: Record<string, { count: number; userLiked: boolean }> = {};
    const commentsMap: Record<string, number> = {};

    likesData?.forEach((l) => {
      if (!likesMap[l.post_id]) likesMap[l.post_id] = { count: 0, userLiked: false };
      likesMap[l.post_id].count++;
      if (l.user_id === user?.id) likesMap[l.post_id].userLiked = true;
    });

    commentsData?.forEach((c) => { commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1; });

    setPosts(postsData.map((p) => ({
      ...p,
      profiles: profilesMap[p.user_id] || null,
      likes_count: likesMap[p.id]?.count || 0,
      comments_count: commentsMap[p.id] || 0,
      user_liked: likesMap[p.id]?.userLiked || false,
    })));
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) { toast.error("Arquivo muito grande (máx 50MB)"); return; }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if (!user) { toast.error("Faça login para postar"); return; }
    if (!newPost.trim() && !mediaFile) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (mediaFile) {
      const ext = mediaFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(path, mediaFile, { contentType: mediaFile.type });
      if (uploadError) { toast.error("Erro ao enviar mídia"); setPosting(false); return; }
      const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      content: newPost.trim() || " ",
      user_id: user.id,
      image_url: imageUrl,
      location: location.trim() || null,
    } as any);
    if (error) toast.error("Erro ao publicar");
    else { setNewPost(""); clearMedia(); setLocation(""); setShowLocationInput(false); loadPosts(); toast.success("Publicado!"); }
    setPosting(false);
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

  const toggleComments = async (postId: string) => {
    if (expandedComments === postId) { setExpandedComments(null); return; }
    setExpandedComments(postId);
    const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    if (data && data.length > 0) {
      const commentUserIds = [...new Set(data.map((c) => c.user_id))];
      const { data: commentProfiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", commentUserIds);
      const profileMap: Record<string, any> = {};
      commentProfiles?.forEach((p) => { profileMap[p.user_id] = p; });
      setComments((prev) => ({ ...prev, [postId]: data.map((c) => ({ ...c, profiles: profileMap[c.user_id] || null })) }));
    } else {
      setComments((prev) => ({ ...prev, [postId]: [] }));
    }
  };

  const handleComment = async (postId: string) => {
    if (!user) { toast.error("Faça login para comentar"); return; }
    if (!newComment.trim()) return;
    await supabase.from("comments").insert({ post_id: postId, content: newComment.trim(), user_id: user.id });
    setNewComment("");
    toggleComments(postId);
    loadPosts();
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const getUserName = () => user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Você";

  return (
    <section className="space-y-4">
      {/* Create Post */}
      {user && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-orange-400">
                {getUserName().charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <Textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`O que está acontecendo, ${getUserName().split(" ")[0]}?`}
                rows={2}
                className="resize-none border-0 bg-transparent focus-visible:ring-0 text-sm p-0 min-h-[60px] text-white placeholder:text-white/30"
              />
              {/* Media preview */}
              {mediaPreview && mediaFile && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-white/10 max-h-60">
                  {mediaFile.type.startsWith("video/") ? (
                    <video src={mediaPreview} className="w-full max-h-60 object-cover" controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full max-h-60 object-cover" />
                  )}
                  <button onClick={clearMedia} className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-orange-400"
                    title="Enviar foto ou vídeo"
                  >
                    <Image className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => setShowLocationInput(!showLocationInput)}
                    className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${showLocationInput || location ? "text-orange-400" : "text-white/30 hover:text-orange-400"}`}
                    title="Adicionar localização"
                  >
                    <MapPin className="w-4.5 h-4.5" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-orange-400">
                    <Smile className="w-4.5 h-4.5" />
                  </button>
                </div>
                <Button
                  onClick={handlePost}
                  disabled={posting || !newPost.trim()}
                  size="sm"
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 h-9 disabled:opacity-40"
                >
                  {posting ? "..." : "Publicar"}
                </Button>
              </div>
              {/* Location input */}
              {showLocationInput && (
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: São Paulo, SP"
                    maxLength={100}
                    className="h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <button onClick={() => { setShowLocationInput(false); setLocation(""); }} className="text-white/30 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {location && !showLocationInput && (
                <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {location}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Strava Activities */}
      {user && <StravaActivities onPost={(content) => { setNewPost(content); }} />}

      {/* Posts */}
      {posts.map((post) => (
        <article key={post.id} className="bg-white/5 rounded-2xl border border-white/5">
          {/* Post header */}
          <div className="flex items-center gap-3 p-4 pb-0">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-orange-400">
                  {getInitials(post.profiles?.display_name)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight truncate">{post.profiles?.display_name || "Anônimo"}</p>
              <p className="text-xs text-white/40">
                {(post as any).location && (
                  <span className="text-orange-400 mr-1.5"><MapPin className="w-3 h-3 inline" /> {(post as any).location} · </span>
                )}
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Post content */}
          <div className="px-4 py-3">
            <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            {post.image_url && (
              <div className="mt-3 rounded-xl overflow-hidden">
                {post.image_url.match(/\.(mp4|webm|mov|avi)/) ? (
                  <video src={post.image_url} className="w-full max-h-96 object-cover" controls />
                ) : (
                  <img src={post.image_url} alt="" className="w-full max-h-96 object-cover" loading="lazy" />
                )}
              </div>
            )}
          </div>

          {/* Reactions count */}
          {(post.likes_count > 0 || post.comments_count > 0) && (
            <div className="flex items-center gap-4 px-4 pb-2 text-xs text-white/40">
              {post.likes_count > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-orange-400 text-orange-400" />
                  {post.likes_count}
                </span>
              )}
              {post.comments_count > 0 && (
                <button onClick={() => toggleComments(post.id)} className="hover:text-white transition-colors">
                  {post.comments_count} comentário{post.comments_count !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center border-t border-white/5 mx-4 py-1.5 gap-1">
            <button
              onClick={() => handleLike(post.id, post.user_liked)}
              className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-all ${
                post.user_liked
                  ? "text-orange-400 bg-orange-500/10"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Heart className={`w-[18px] h-[18px] ${post.user_liked ? "fill-orange-400" : ""}`} /> Curtir
            </button>
            <button
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white transition-all"
            >
              <MessageCircle className="w-[18px] h-[18px]" /> Comentar
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }}
              className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white transition-all"
            >
              <Share2 className="w-[18px] h-[18px]" /> Compartilhar
            </button>
          </div>

          {/* Comments section */}
          {expandedComments === post.id && (
            <div className="border-t border-white/5 px-4 py-3 space-y-3">
              {comments[post.id]?.map((comment: any) => (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-white/50">
                      {getInitials(comment.profiles?.display_name)}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-2xl px-3 py-2 max-w-[85%]">
                    <p className="text-xs font-semibold text-white">{comment.profiles?.display_name || "Anônimo"}</p>
                    <p className="text-xs text-white/70 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
              {user && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-orange-400">
                      {getUserName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escreva um comentário..."
                      className="rounded-xl bg-white/5 border-white/10 pr-10 text-xs h-8 text-white placeholder:text-white/30 focus-visible:ring-0"
                      onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                    />
                    {newComment.trim() && (
                      <button
                        onClick={() => handleComment(post.id)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </article>
      ))}

      {posts.length === 0 && (
        <div className="bg-white/5 rounded-2xl p-10 text-center border border-white/5">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-white/50 text-sm">Nenhuma publicação ainda.</p>
          <p className="text-white/30 text-xs mt-1">Seja o primeiro a compartilhar!</p>
        </div>
      )}
    </section>
  );
};

export default FeedSection;
