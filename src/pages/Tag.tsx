import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Hash, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { renderRichText, buildMentionMap } from "@/lib/textParser";

interface TagPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url: string | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

const TagPage = () => {
  const { tagName } = useParams<{ tagName: string }>();
  const [posts, setPosts] = useState<TagPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentionMap, setMentionMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!tagName) return;
    loadPosts();
  }, [tagName]);

  const loadPosts = async () => {
    setLoading(true);
    const tag = decodeURIComponent(tagName!).toLowerCase();
    // Use ilike for hashtag pattern, case-insensitive
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .ilike("content", `%#${tag}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, any> = {};
    profilesData?.forEach((p) => {
      profileMap[p.user_id] = p;
    });

    setMentionMap(buildMentionMap(profilesData || []));
    setPosts(
      postsData.map((p) => ({
        ...p,
        profiles: profileMap[p.user_id] || null,
      }))
    );
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1e]">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/20 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <Hash className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">#{decodeURIComponent(tagName || "")}</h1>
              <p className="text-xs text-white/50 mt-0.5">
                {loading ? "Carregando..." : `${posts.length} publicação${posts.length !== 1 ? "ões" : ""}`}
              </p>
            </div>
          </div>
        </div>

        {!loading && posts.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <p className="text-sm">Ninguém publicou com essa tag ainda.</p>
          </div>
        )}

        <div className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="bg-white/5 rounded-2xl border border-white/5 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Link to={`/usuario/${post.user_id}`} className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {post.profiles?.avatar_url ? (
                    <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-orange-400">
                      {post.profiles?.display_name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/usuario/${post.user_id}`}
                    className="text-sm font-semibold text-white hover:text-orange-400 transition-colors"
                  >
                    {post.profiles?.display_name || "Anônimo"}
                  </Link>
                  <p className="text-xs text-white/40">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                {renderRichText(post.content, mentionMap)}
              </p>
              {post.image_url && (
                <div className="mt-3 rounded-xl overflow-hidden">
                  {post.image_url.match(/\.(mp4|webm|mov|avi)/) ? (
                    <video src={post.image_url} className="w-full max-h-96 object-cover" controls />
                  ) : (
                    <img src={post.image_url} alt="" className="w-full max-h-96 object-cover" loading="lazy" />
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TagPage;
