import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Send, ThumbsUp, Image, Smile, Video } from "lucide-react";
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
      .select("*, profiles!posts_user_id_fkey(display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!postsData) return;

    const postIds = postsData.map((p) => p.id);
    if (postIds.length === 0) { setPosts([]); return; }

    const { data: likesData } = await supabase
      .from("likes")
      .select("post_id, user_id")
      .in("post_id", postIds);

    const { data: commentsData } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds);

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
        profiles: p.profiles as any,
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
      .select("*, profiles!comments_user_id_fkey(display_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments((prev) => ({ ...prev, [postId]: data || [] }));
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
    <section id="feed" className="space-y-4">
      {/* Create Post - Facebook style */}
      {user && (
        <div className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary-foreground">
                {getUserName().charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => document.getElementById("post-textarea")?.focus()}
              className="flex-1 bg-secondary rounded-full px-4 py-2.5 text-left text-muted-foreground text-[15px] hover:bg-secondary/80 transition-colors"
            >
              No que você está pensando, {getUserName().split(" ")[0]}?
            </button>
          </div>
          
          {newPost !== "" && (
            <Textarea
              id="post-textarea"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Compartilhe sua história, conquista ou dica esportiva..."
              rows={3}
              className="mb-3 resize-none border-0 bg-transparent focus-visible:ring-0 text-[15px]"
              autoFocus
            />
          )}

          {newPost === "" && (
            <Textarea
              id="post-textarea"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder=""
              rows={1}
              className="hidden"
            />
          )}

          <div className="flex items-center border-t border-border pt-3 gap-1">
            <button className="flex items-center gap-2 flex-1 justify-center py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-semibold text-muted-foreground">
              <Video className="w-5 h-5 text-destructive" /> Vídeo ao vivo
            </button>
            <button className="flex items-center gap-2 flex-1 justify-center py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-semibold text-muted-foreground">
              <Image className="w-5 h-5 text-success" /> Foto/vídeo
            </button>
            <button className="flex items-center gap-2 flex-1 justify-center py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-semibold text-muted-foreground">
              <Smile className="w-5 h-5 text-accent-foreground" /> Sentimento
            </button>
          </div>

          {newPost.trim() && (
            <div className="flex justify-end mt-3">
              <Button
                onClick={handlePost}
                disabled={posting}
                className="bg-primary text-primary-foreground font-semibold rounded-lg px-6"
              >
                {posting ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      {posts.map((post) => (
        <article
          key={post.id}
          className="bg-card rounded-lg shadow-card"
        >
          {/* Post header */}
          <div className="flex items-center gap-3 p-4 pb-0">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">
                  {getInitials(post.profiles?.display_name)}
                </span>
              )}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground leading-tight">{post.profiles?.display_name || "Anônimo"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Post content */}
          <div className="px-4 py-3">
            <p className="text-[15px] text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>

          {/* Reactions count */}
          {(post.likes_count > 0 || post.comments_count > 0) && (
            <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {post.likes_count > 0 && (
                  <>
                    <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground">
                      <ThumbsUp className="w-2.5 h-2.5" />
                    </span>
                    <span>{post.likes_count}</span>
                  </>
                )}
              </div>
              {post.comments_count > 0 && (
                <button onClick={() => toggleComments(post.id)} className="hover:underline">
                  {post.comments_count} comentário{post.comments_count !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center border-t border-border mx-4 py-1">
            <button
              onClick={() => handleLike(post.id, post.user_liked)}
              className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-semibold ${
                post.user_liked ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${post.user_liked ? "fill-primary" : ""}`} /> Curtir
            </button>
            <button
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-2 flex-1 justify-center py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-semibold text-muted-foreground"
            >
              <MessageCircle className="w-5 h-5" /> Comentar
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }}
              className="flex items-center gap-2 flex-1 justify-center py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-semibold text-muted-foreground"
            >
              <Share2 className="w-5 h-5" /> Compartilhar
            </button>
          </div>

          {/* Comments section */}
          {expandedComments === post.id && (
            <div className="border-t border-border px-4 py-3 space-y-3">
              {comments[post.id]?.map((comment: any) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-muted-foreground">
                      {getInitials(comment.profiles?.display_name)}
                    </span>
                  </div>
                  <div className="bg-secondary rounded-2xl px-3 py-2 max-w-[85%]">
                    <p className="text-[13px] font-semibold text-foreground">{comment.profiles?.display_name || "Anônimo"}</p>
                    <p className="text-[13px] text-foreground/90">{comment.content}</p>
                  </div>
                </div>
              ))}
              {user && (
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">
                      {getUserName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escreva um comentário..."
                      className="rounded-full bg-secondary border-0 pr-10 text-[13px] h-9 focus-visible:ring-0"
                      onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                    />
                    {newComment.trim() && (
                      <button
                        onClick={() => handleComment(post.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                      >
                        <Send className="w-4 h-4" />
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
        <div className="bg-card rounded-lg shadow-card p-8 text-center">
          <p className="text-muted-foreground text-[15px]">Nenhuma publicação ainda. Seja o primeiro a compartilhar! 🎉</p>
        </div>
      )}
    </section>
  );
};

export default FeedSection;
