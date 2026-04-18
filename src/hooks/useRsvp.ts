import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type RsvpStatus = "going" | "maybe" | "not_going";

export interface RsvpCounts {
  going: number;
  maybe: number;
  not_going: number;
}

export const useRsvp = (eventId: string | undefined) => {
  const { user } = useAuth();
  const [myStatus, setMyStatus] = useState<RsvpStatus | null>(null);
  const [counts, setCounts] = useState<RsvpCounts>({ going: 0, maybe: 0, not_going: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!eventId) return;
    const { data } = await supabase
      .from("event_rsvps" as any)
      .select("status, user_id")
      .eq("event_id", eventId);
    const c: RsvpCounts = { going: 0, maybe: 0, not_going: 0 };
    let mine: RsvpStatus | null = null;
    (data as any[] | null)?.forEach((r) => {
      c[r.status as RsvpStatus]++;
      if (user && r.user_id === user.id) mine = r.status;
    });
    setCounts(c);
    setMyStatus(mine);
    setLoading(false);
  }, [eventId, user]);

  useEffect(() => { load(); }, [load]);

  const setRsvp = async (status: RsvpStatus) => {
    if (!user) { toast.error("Faça login para confirmar presença"); return; }
    if (!eventId) return;
    const { error } = await (supabase.from("event_rsvps" as any) as any).upsert(
      { event_id: eventId, user_id: user.id, status },
      { onConflict: "event_id,user_id" }
    );
    if (error) { toast.error("Erro ao registrar presença"); return; }
    toast.success(status === "going" ? "Presença confirmada!" : status === "maybe" ? "Marcado como talvez" : "Marcado como não vai");
    load();
  };

  const removeRsvp = async () => {
    if (!user || !eventId) return;
    await supabase.from("event_rsvps" as any).delete().eq("event_id", eventId).eq("user_id", user.id);
    load();
  };

  return { myStatus, counts, loading, setRsvp, removeRsvp };
};
