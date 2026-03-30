import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Send, Image, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

  useEffect(() => {
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

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

    commentsData?.forEach((c) => {
      commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
    });

    setPosts(
      postsData.map((p) => ({
        ...p,
        profiles: profilesMap[p.user_id] || null,
        likes_count: likesMap[p.id]?.count || 0,
        comments_count: commentsMap[p.id] || 0,
        user_liked: likesMap[p.id]?.userLiked || false,
      }))
    );
  };

  const handlePost = async () => {
    if (!user) { toast.error("Faça login para postar"); return; }
    if (!newPost.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("posts").insert({ content: newPost.trim(), user_id: user.id });
    if (error) toast.error("Erro ao publicar");
    else { setNewPost(""); loadPosts(); toast.success("Publicado!"); }
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
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    
    if (data && data.length > 0) {
      const commentUserIds = [...new Set(data.map((c) => c.user_id))];
      const { data: commentProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", commentUserIds);
      const profileMap: Record<string, any> = {};
      commentProfiles?.forEach((p) => { profileMap[p.user_id] = p; });
      const enriched = data.map((c) => ({ ...c, profiles: profileMap[c.user_id] || null }));
      setComments((prev) => ({ ...prev, [postId]: enriched }));
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
        <div className="bg-card rounded-2xl shadow-card p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {getUserName().charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <Textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`O que está acontecendo, ${getUserName().split(" ")[0]}?`}
                rows={2}
                className="resize-none border-0 bg-transparent focus-visible:ring-0 text-sm p-0 min-h-[60px] placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary">
                    <Image className="w-4.5 h-4.5" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary">
                    <Smile className="w-4.5 h-4.5" />
                  </button>
                </div>
                <Button
                  onClick={handlePost}
                  disabled={posting || !newPost.trim()}
                  size="sm"
                  className="rounded-xl bg-primary text-primary-foreground font-semibold px-5 h-9 disabled:opacity-40"
                >
                  {posting ? "..." : "Publicar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.map((post) => (
        <article key={post.id} className="bg-card rounded-2xl shadow-card animate-fade-in">
          {/* Post header */}
          <div className="flex items-center gap-3 p-4 pb-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary">
                  {getInitials(post.profiles?.display_name)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">{post.profiles?.display_name || "Anônimo"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Post content */}
          <div className="px-4 py-3">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>

          {/* Reactions count */}
          {(post.likes_count > 0 || post.comments_count > 0) && (
            <div className="flex items-center gap-4 px-4 pb-2 text-xs text-muted-foreground">
              {post.likes_count > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-primary text-primary" />
                  {post.likes_count}
                </span>
              )}
              {post.comments_count > 0 && (
                <button onClick={() => toggleComments(post.id)} className="hover:text-foreground transition-colors">
                  {post.comments_count} comentário{post.comments_count !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center border-t border-border mx-4 py-1.5 gap-1">
            <button
              onClick={() => handleLike(post.id, post.user_liked)}
              className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-all ${
                post.user_liked
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Heart className={`w-[18px] h-[18px] ${post.user_liked ? "fill-primary" : ""}`} /> Curtir
            </button>
            <button
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <MessageCircle className="w-[18px] h-[18px]" /> Comentar
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }}
              className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <Share2 className="w-[18px] h-[18px]" /> Compartilhar
            </button>
          </div>

          {/* Comments section */}
          {expandedComments === post.id && (
            <div className="border-t border-border px-4 py-3 space-y-3">
              {comments[post.id]?.map((comment: any) => (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {getInitials(comment.profiles?.display_name)}
                    </span>
                  </div>
                  <div className="bg-secondary rounded-2xl px-3 py-2 max-w-[85%]">
                    <p className="text-xs font-semibold text-foreground">{comment.profiles?.display_name || "Anônimo"}</p>
                    <p className="text-xs text-foreground/85 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
              {user && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {getUserName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escreva um comentário..."
                      className="rounded-xl bg-secondary border-0 pr-10 text-xs h-8 focus-visible:ring-0"
                      onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                    />
                    {newComment.trim() && (
                      <button
                        onClick={() => handleComment(post.id)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
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
        <div className="bg-card rounded-2xl shadow-card p-10 text-center animate-fade-in">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-muted-foreground text-sm">Nenhuma publicação ainda.</p>
          <p className="text-muted-foreground text-xs mt-1">Seja o primeiro a compartilhar!</p>
        </div>
      )}
    </section>
  );
};

export default FeedSection;
