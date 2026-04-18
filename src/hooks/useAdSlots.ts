import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdSlot {
  id: string;
  position: "sidebar_left" | "sidebar_right";
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  active: boolean;
  display_order: number;
}

export const useAdSlots = (position?: "sidebar_left" | "sidebar_right") => {
  const [ads, setAds] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = (supabase.from("ad_slots" as any) as any)
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true });
    if (position) q = q.eq("position", position);
    const { data } = await q;
    setAds((data || []) as AdSlot[]);
    setLoading(false);
  }, [position]);

  useEffect(() => { load(); }, [load]);

  return { ads, loading, reload: load };
};

export const useAllAdSlots = () => {
  const [ads, setAds] = useState<AdSlot[]>([]);

  const load = useCallback(async () => {
    const { data } = await (supabase.from("ad_slots" as any) as any)
      .select("*")
      .order("position", { ascending: true })
      .order("display_order", { ascending: true });
    setAds((data || []) as AdSlot[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ads, reload: load };
};
