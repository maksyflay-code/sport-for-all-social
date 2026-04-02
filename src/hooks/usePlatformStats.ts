import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformStats = () => {
  const [stats, setStats] = useState({ athletes: 0, posts: 0, events: 0 });

  useEffect(() => {
    const load = async () => {
      const [profilesRes, postsRes, eventsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true })
          .gte("event_date", new Date().toISOString().split("T")[0]),
      ]);
      setStats({
        athletes: profilesRes.count ?? 0,
        posts: postsRes.count ?? 0,
        events: eventsRes.count ?? 0,
      });
    };
    load();
  }, []);

  return stats;
};
