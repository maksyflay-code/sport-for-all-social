
CREATE OR REPLACE FUNCTION public.upsert_strava_distance(_user_id uuid, _total_km numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.strava_distance (user_id, total_km, last_synced_at)
  VALUES (_user_id, _total_km, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_km = EXCLUDED.total_km,
        last_synced_at = now();

  IF _total_km >= 10  THEN PERFORM public.grant_badge(_user_id, 'sports_10');  END IF;
  IF _total_km >= 50  THEN PERFORM public.grant_badge(_user_id, 'sports_50');  END IF;
  IF _total_km >= 100 THEN PERFORM public.grant_badge(_user_id, 'sports_100'); END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.upsert_strava_distance(uuid, numeric) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_ad_metrics()
RETURNS TABLE(ad_id uuid, impressions bigint, clicks bigint, ctr numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    s.id AS ad_id,
    COALESCE(SUM(CASE WHEN e.event_type = 'impression' THEN 1 ELSE 0 END), 0) AS impressions,
    COALESCE(SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
    CASE
      WHEN COALESCE(SUM(CASE WHEN e.event_type = 'impression' THEN 1 ELSE 0 END), 0) = 0 THEN 0
      ELSE ROUND(
        (SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END)::numeric
         / SUM(CASE WHEN e.event_type = 'impression' THEN 1 ELSE 0 END)::numeric) * 100,
        2
      )
    END AS ctr
  FROM public.ad_slots s
  LEFT JOIN public.ad_events e ON e.ad_id = s.id
  GROUP BY s.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_ad_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ad_metrics() TO authenticated;
