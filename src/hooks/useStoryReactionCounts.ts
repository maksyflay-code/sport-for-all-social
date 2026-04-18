import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReactionCount {
  emoji: string;
  count: number;
}

export const useStoryReactionCounts = (storyId: string | undefined, refreshKey?: unknown) => {
  const [counts, setCounts] = useState<ReactionCount[]>([]);

  const load = useCallback(async () => {
    if (!storyId) { setCounts([]); return; }
    const { data, error } = await supabase.rpc("get_story_reaction_counts" as any, { _story_id: storyId });
    if (error) { setCounts([]); return; }
    setCounts((data || []) as ReactionCount[]);
  }, [storyId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const total = counts.reduce((s, c) => s + c.count, 0);
  return { counts, total, reload: load };
};
