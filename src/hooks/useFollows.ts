import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useFollows = (targetUserId?: string) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadFollowData = useCallback(async () => {
    const userId = targetUserId || user?.id;
    if (!userId) return;

    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    ]);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);

    if (user && targetUserId && user.id !== targetUserId) {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      setIsFollowing(!!data);
    }
  }, [user, targetUserId]);

  useEffect(() => { loadFollowData(); }, [loadFollowData]);

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    setLoading(true);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId } as any);
    }
    await loadFollowData();
    setLoading(false);
  };

  return { isFollowing, followersCount, followingCount, toggleFollow, loading, refresh: loadFollowData };
};

export const useSuggestedUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get users the current user already follows
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followingIds = following?.map((f) => f.following_id) || [];
      followingIds.push(user.id); // exclude self

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, bio, sports")
        .limit(50);

      if (!profiles) return;

      // Buscar IDs de usuários com pelo menos 1 post (sinal de atividade real)
      const { data: postedRows } = await supabase
        .from("posts")
        .select("user_id");
      const activeUserIds = new Set((postedRows || []).map((p: any) => p.user_id));

      // Filtro anti-bot: tem que ter sinal mínimo de atividade real
      // (avatar customizado OU bio OU esportes OU pelo menos 1 post)
      const filtered = profiles
        .filter((p) => !followingIds.includes(p.user_id))
        .filter((p) => {
          const hasAvatar = !!p.avatar_url;
          const hasBio = !!(p.bio && p.bio.trim().length > 0);
          const hasSports = Array.isArray(p.sports) && p.sports.length > 0;
          const hasPosted = activeUserIds.has(p.user_id);
          return hasAvatar || hasBio || hasSports || hasPosted;
        });

      setUsers(filtered);
    };
    load();
  }, [user]);

  return users;
};
