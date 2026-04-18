import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnlineUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  online_at: string;
}

export const useOnlinePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // Pega meu profile p/ broadcast
      const { data: me } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      channel = supabase.channel("online-users", {
        config: { presence: { key: user.id } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel!.presenceState<OnlineUser>();
          const users: OnlineUser[] = [];
          Object.values(state).forEach((arr) => {
            if (arr[0]) users.push(arr[0]);
          });
          // Mais recentes primeiro, sem o próprio usuário
          users.sort((a, b) => b.online_at.localeCompare(a.online_at));
          setOnlineUsers(users.filter((u) => u.user_id !== user.id));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel!.track({
              user_id: user.id,
              display_name: me?.display_name ?? null,
              avatar_url: me?.avatar_url ?? null,
              online_at: new Date().toISOString(),
            });
          }
        });
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  return onlineUsers;
};
