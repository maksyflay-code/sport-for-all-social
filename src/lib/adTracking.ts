import { supabase } from "@/integrations/supabase/client";

// Avoid duplicate impression logs per ad per page session
const loggedImpressions = new Set<string>();

export const trackAdImpression = async (adId: string) => {
  if (loggedImpressions.has(adId)) return;
  loggedImpressions.add(adId);
  const { data: { user } } = await supabase.auth.getUser();
  await (supabase.from("ad_events" as any) as any).insert({
    ad_id: adId,
    event_type: "impression",
    user_id: user?.id ?? null,
  });
};

export const trackAdClick = async (adId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  await (supabase.from("ad_events" as any) as any).insert({
    ad_id: adId,
    event_type: "click",
    user_id: user?.id ?? null,
  });
};
