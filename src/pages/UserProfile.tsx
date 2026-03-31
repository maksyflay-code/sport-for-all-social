import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";
import Header from "@/components/Header";
import FollowersModal from "@/components/FollowersModal";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Medal, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const { isFollowing, followersCount, followingCount, toggleFollow, loading } = useFollows(userId);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    if (userId) {
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [userId]);

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

  if (!profile) return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="flex items-center justify-center h-64">
        <p className="text-white/40">Carregando...</p>
      </div>
    </div>
  );

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
          <div className="h-32 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-[#16162a]" />
          <div className="px-6 pb-5 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-[#16162a] border-4 border-[#1a1a2e] flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white/30">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              {!isOwnProfile && user && (
                <div className="flex gap-2 mb-1">
                  <Button
                    onClick={handleFollow}
                    disabled={loading}
                    className={`rounded-xl font-semibold gap-2 ${
                      isFollowing
                        ? "bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                  >
                    {isFollowing ? <><UserCheck className="w-4 h-4" /> Seguindo</> : <><UserPlus className="w-4 h-4" /> Seguir</>}
                  </Button>
                  <Button
                    onClick={handleMessage}
                    className="rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold gap-2 border border-white/10"
                  >
                    <MessageCircle className="w-4 h-4" /> Mensagem
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-3">
              <h2 className="text-xl font-bold text-white">{profile.display_name || "Anônimo"}</h2>
              {profile.bio && <p className="text-sm text-white/50 mt-1">{profile.bio}</p>}
            </div>

            {/* Stats - clickable */}
            <div className="flex gap-6 mt-4">
              <button onClick={() => setModalType("followers")} className="text-center hover:opacity-80 transition-opacity">
                <p className="text-lg font-bold text-white">{followersCount}</p>
                <p className="text-xs text-white/40">Seguidores</p>
              </button>
              <button onClick={() => setModalType("following")} className="text-center hover:opacity-80 transition-opacity">
                <p className="text-lg font-bold text-white">{followingCount}</p>
                <p className="text-xs text-white/40">Seguindo</p>
              </button>
            </div>
          </div>
        </div>

        {profile.sports?.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mt-4">
            <h3 className="text-sm font-bold text-white mb-3">Modalidades</h3>
            <div className="flex flex-wrap gap-2">
              {profile.sports.map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-orange-500/10 text-orange-300 border border-orange-400/20">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.achievements?.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mt-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Medal className="w-4 h-4 text-orange-400" /> Conquistas
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.achievements.map((a: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-300 text-xs font-medium border border-orange-400/20">
                  <Medal className="w-3 h-3" /> {a}
                </span>
              ))}
            </div>
          </div>
        )}
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
