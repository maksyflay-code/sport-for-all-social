import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Badge {
  id: string;
  code: string;
  category: string;
  threshold: number;
  title: string;
  description: string;
  emoji: string;
}

export interface UserBadge extends Badge {
  earned_at: string;
}

export const useUserBadges = (userId: string | undefined) => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("user_badges" as any)
        .select("earned_at, badges(*)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });
      const list: UserBadge[] = ((data as any[] | null) || [])
        .filter((r) => r.badges)
        .map((r) => ({ ...(r.badges as Badge), earned_at: r.earned_at }));
      setBadges(list);
      setLoading(false);
    })();
  }, [userId]);

  return { badges, loading };
};
