-- Public aggregated view: emoji counts per story, no user_id exposed
CREATE OR REPLACE VIEW public.story_reaction_counts
WITH (security_invoker = on) AS
SELECT
  story_id,
  emoji,
  count(*)::int AS count
FROM public.story_reactions
GROUP BY story_id, emoji;

-- Allow public read of aggregates (the view groups away user_id, so no PII leaks)
-- Need a permissive SELECT policy on the base table for the view to return rows under security_invoker.
-- We add a policy that ONLY exposes (story_id, emoji) effectively — but RLS is row-level, so we add a
-- separate policy permitting anyone to SELECT, and rely on the view to drop user_id.
-- To avoid leaking user_id via direct table access, we keep existing policies and add a policy
-- restricted to anon/auth that allows SELECT — but then anyone could query the table directly.
-- Safer: use a SECURITY DEFINER function for counts instead of opening the table.
DROP VIEW public.story_reaction_counts;

CREATE OR REPLACE FUNCTION public.get_story_reaction_counts(_story_id uuid)
RETURNS TABLE(emoji text, count int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT emoji, count(*)::int
  FROM public.story_reactions
  WHERE story_id = _story_id
  GROUP BY emoji
  ORDER BY count(*) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_story_reaction_counts(uuid) TO anon, authenticated;