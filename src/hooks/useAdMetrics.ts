import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdMetric {
  ad_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export const useAdMetrics = () => {
  const [metrics, setMetrics] = useState<Record<string, AdMetric>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_ad_metrics");
    if (!error && data) {
      const map: Record<string, AdMetric> = {};
      for (const row of data as AdMetric[]) {
        map[row.ad_id] = {
          ad_id: row.ad_id,
          impressions: Number(row.impressions) || 0,
          clicks: Number(row.clicks) || 0,
          ctr: Number(row.ctr) || 0,
        };
      }
      setMetrics(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { metrics, loading, reload: load };
};
