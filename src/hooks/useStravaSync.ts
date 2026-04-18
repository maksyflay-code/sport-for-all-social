import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StravaDistance {
  total_km: number;
  last_synced_at: string;
}

export const useStravaSync = (userId: string | undefined) => {
  const [data, setData] = useState<StravaDistance | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data: row } = await supabase
      .from("strava_distance" as any)
      .select("total_km, last_synced_at")
      .eq("user_id", userId)
      .maybeSingle();
    setData((row as any) || null);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const sync = useCallback(async () => {
    if (!userId) return;
    setSyncing(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("strava-sync-distance", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      const km = (res as any)?.total_km;
      toast.success(`Sincronizado: ${km} km acumulados`);
      await load();
    } catch (e: any) {
      toast.error("Erro ao sincronizar Strava: " + (e.message || ""));
    } finally {
      setSyncing(false);
    }
  }, [userId, load]);

  return { data, syncing, sync, reload: load };
};
