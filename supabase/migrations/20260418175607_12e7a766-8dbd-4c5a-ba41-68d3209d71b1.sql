-- Create ad_events table for tracking impressions and clicks
CREATE TABLE public.ad_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id uuid NOT NULL REFERENCES public.ad_slots(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'click')),
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for fast aggregations
CREATE INDEX idx_ad_events_ad_id ON public.ad_events(ad_id);
CREATE INDEX idx_ad_events_type_created ON public.ad_events(event_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can log an event
CREATE POLICY "Anyone can log ad events"
ON public.ad_events
FOR INSERT
TO public
WITH CHECK (event_type IN ('impression', 'click'));

-- Only admins can read events (for metrics dashboard)
CREATE POLICY "Admins can view ad events"
ON public.ad_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Aggregated metrics function (admin-only via RLS on ad_events)
CREATE OR REPLACE FUNCTION public.get_ad_metrics()
RETURNS TABLE(
  ad_id uuid,
  impressions bigint,
  clicks bigint,
  ctr numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;