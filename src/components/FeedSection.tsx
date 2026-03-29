import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send } from "lucide-react";
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
    else { setNewPost(""); loadPosts(); toast.success("Publicado! 🎉"); }
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

  return (
    <section id="feed" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-3">
            HISTÓRIAS QUE <span className="text-gradient">INSPIRAM</span>
          </h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Compartilhe suas conquistas com a comunidade
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Create Post */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-5 shadow-card border border-border"
            >
              <Textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Compartilhe sua história, conquista ou dica esportiva... 💙"
                rows={3}
                className="mb-3 resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handlePost}
                  disabled={posting || !newPost.trim()}
                  className="gradient-hero text-primary-foreground font-semibold gap-2"
                >
                  <Send className="w-4 h-4" /> {posting ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Posts */}
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                    {post.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary-foreground">
                        {getInitials(post.profiles?.display_name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{post.profiles?.display_name || "Anônimo"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-card-foreground/90 font-body mb-5 leading-relaxed whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center gap-6 pt-4 border-t border-border">
                <button
                  onClick={() => handleLike(post.id, post.user_liked)}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                    post.user_liked ? "text-primary" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.user_liked ? "fill-primary" : ""}`} /> {post.likes_count}
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors text-sm font-semibold"
                >
                  <MessageCircle className="w-5 h-5" /> {post.comments_count}
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors text-sm font-semibold ml-auto"
                >
                  <Share2 className="w-5 h-5" /> Compartilhar
                </button>
              </div>

              {/* Comments */}
              {expandedComments === post.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-border space-y-3"
                >
                  {comments[post.id]?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-secondary-foreground">
                          {getInitials(comment.profiles?.display_name)}
                        </span>
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2 flex-1">
                        <p className="text-sm font-semibold text-foreground">{comment.profiles?.display_name || "Anônimo"}</p>
                        <p className="text-sm text-foreground/80">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {user && (
                    <div className="flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escreva um comentário..."
                        onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                      />
                      <Button size="icon" onClick={() => handleComment(post.id)} className="bg-secondary text-secondary-foreground">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.article>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nenhuma publicação ainda. Seja o primeiro a compartilhar! 🎉</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeedSection;
