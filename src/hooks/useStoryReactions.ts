import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StoryReaction {
  id: string;
  story_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const REACTION_EMOJIS = ["❤️", "🔥", "👏", "😂", "😮"] as const;

export const useStoryReactions = (storyId: string | undefined, isOwner: boolean) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<StoryReaction[]>([]);
  const [myEmoji, setMyEmoji] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storyId) { setReactions([]); setMyEmoji(null); return; }
    const { data } = await (supabase.from("story_reactions" as any) as any)
      .select("*")
      .eq("story_id", storyId);
    const list = (data || []) as any[];

    if (isOwner && list.length > 0) {
      const ids = [...new Set(list.map((r) => r.user_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);
      const pmap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      setReactions(list.map((r) => ({
        ...r,
        display_name: pmap.get(r.user_id)?.display_name ?? null,
        avatar_url: pmap.get(r.user_id)?.avatar_url ?? null,
      })));
    } else {
      setReactions(list.map((r) => ({ ...r, display_name: null, avatar_url: null })));
    }

    const mine = list.find((r) => r.user_id === user?.id);
    setMyEmoji(mine?.emoji ?? null);
  }, [storyId, user?.id, isOwner]);

  useEffect(() => { load(); }, [load]);

  const react = async (emoji: string) => {
    if (!user || !storyId) return;
    if (myEmoji === emoji) {
      // toggle off
      await (supabase.from("story_reactions" as any) as any)
        .delete()
        .eq("story_id", storyId)
        .eq("user_id", user.id);
      setMyEmoji(null);
    } else if (myEmoji) {
      await (supabase.from("story_reactions" as any) as any)
        .update({ emoji })
        .eq("story_id", storyId)
        .eq("user_id", user.id);
      setMyEmoji(emoji);
    } else {
      await (supabase.from("story_reactions" as any) as any)
        .insert({ story_id: storyId, user_id: user.id, emoji });
      setMyEmoji(emoji);
    }
    load();
  };

  return { reactions, myEmoji, react };
};
