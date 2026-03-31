import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSuggestedUsers } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

const SuggestedUsers = () => {
  const { user } = useAuth();
  const suggestedUsers = useSuggestedUsers();
  const navigate = useNavigate();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!user || suggestedUsers.length === 0) return null;

  const handleFollow = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingId(targetUserId);
    if (followedIds.has(targetUserId)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      setFollowedIds((prev) => { const n = new Set(prev); n.delete(targetUserId); return n; });
      toast.success("Deixou de seguir");
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId } as any);
      setFollowedIds((prev) => new Set(prev).add(targetUserId));
      toast.success("Seguindo!");
    }
    setLoadingId(null);
  };

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
      <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-orange-400" /> Sugestões para seguir
      </h3>
      <div className="space-y-3">
        {suggestedUsers.slice(0, 5).map((profile) => (
          <div
            key={profile.user_id}
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => navigate(`/usuario/${profile.user_id}`)}
          >
            <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-orange-400">
                  {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                {profile.display_name || "Anônimo"}
              </p>
              {profile.sports?.length > 0 && (
                <p className="text-xs text-white/40 truncate">{profile.sports.slice(0, 3).join(", ")}</p>
              )}
            </div>
            <button
              onClick={(e) => handleFollow(profile.user_id, e)}
              disabled={loadingId === profile.user_id}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                followedIds.has(profile.user_id)
                  ? "bg-white/10 text-orange-400"
                  : "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
              }`}
            >
              {followedIds.has(profile.user_id) ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;
