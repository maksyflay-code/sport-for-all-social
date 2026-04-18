import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoryGroup {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  stories: Story[];
}

export const useStories = () => {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: stories } = await supabase
      .from("stories" as any)
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    const list = (stories as any as Story[] | null) || [];
    if (list.length === 0) { setGroups([]); setLoading(false); return; }

    const userIds = [...new Set(list.map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    profiles?.forEach((p) => { profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url }; });

    const grouped: Record<string, StoryGroup> = {};
    list.forEach((s) => {
      if (!grouped[s.user_id]) {
        grouped[s.user_id] = {
          user_id: s.user_id,
          display_name: profileMap[s.user_id]?.display_name || null,
          avatar_url: profileMap[s.user_id]?.avatar_url || null,
          stories: [],
        };
      }
      grouped[s.user_id].stories.push(s);
    });

    setGroups(Object.values(grouped));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { groups, loading, reload: load };
};
