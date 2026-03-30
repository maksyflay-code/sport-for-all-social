
CREATE TABLE public.strava_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    strava_athlete_id bigint NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at bigint NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own strava tokens"
ON public.strava_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strava tokens"
ON public.strava_tokens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strava tokens"
ON public.strava_tokens FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strava tokens"
ON public.strava_tokens FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
