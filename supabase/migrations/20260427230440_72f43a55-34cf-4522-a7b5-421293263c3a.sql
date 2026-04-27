-- Helper interno: lista de domínios considerados suspeitos
CREATE OR REPLACE FUNCTION public.is_suspicious_email_domain(_domain text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(_domain) = ANY (ARRAY[
    -- email descartável / temporário comum
    'mailinator.com','guerrillamail.com','tempmail.com','10minutemail.com',
    'trashmail.com','yopmail.com','sharklasers.com','throwawaymail.com',
    'maildrop.cc','getnada.com','dispostable.com','tempr.email',
    'fakeinbox.com','mintemail.com','mohmal.com','emailondeck.com'
  ]);
$$;

-- Estatísticas agregadas por domínio (somente admin)
CREATE OR REPLACE FUNCTION public.get_email_domain_stats()
RETURNS TABLE (
  domain text,
  total_users bigint,
  confirmed_users bigint,
  active_users bigint,
  rejection_rate numeric,
  activation_rate numeric,
  is_suspicious boolean,
  last_signup timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      lower(split_part(u.email, '@', 2)) AS domain,
      u.id AS user_id,
      (u.email_confirmed_at IS NOT NULL) AS confirmed,
      u.created_at,
      p.avatar_url,
      p.bio,
      p.sports,
      EXISTS (SELECT 1 FROM public.posts po WHERE po.user_id = u.id) AS has_posted
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE u.email IS NOT NULL AND u.email <> ''
  )
  SELECT
    b.domain,
    count(*)::bigint AS total_users,
    count(*) FILTER (WHERE b.confirmed)::bigint AS confirmed_users,
    count(*) FILTER (
      WHERE b.avatar_url IS NOT NULL
         OR (b.bio IS NOT NULL AND length(trim(b.bio)) > 0)
         OR (b.sports IS NOT NULL AND array_length(b.sports, 1) > 0)
         OR b.has_posted
    )::bigint AS active_users,
    ROUND(
      (count(*) FILTER (WHERE NOT b.confirmed))::numeric
        / NULLIF(count(*), 0)::numeric * 100, 1
    ) AS rejection_rate,
    ROUND(
      (count(*) FILTER (
        WHERE b.avatar_url IS NOT NULL
           OR (b.bio IS NOT NULL AND length(trim(b.bio)) > 0)
           OR (b.sports IS NOT NULL AND array_length(b.sports, 1) > 0)
           OR b.has_posted
      ))::numeric / NULLIF(count(*), 0)::numeric * 100, 1
    ) AS activation_rate,
    public.is_suspicious_email_domain(b.domain) AS is_suspicious,
    max(b.created_at) AS last_signup
  FROM base b
  GROUP BY b.domain
  ORDER BY
    public.is_suspicious_email_domain(b.domain) DESC,
    count(*) DESC;
END;
$$;

-- Listar usuários de um domínio específico (somente admin)
CREATE OR REPLACE FUNCTION public.get_users_by_email_domain(_domain text)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  avatar_url text,
  bio text,
  confirmed boolean,
  has_activity boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    p.display_name,
    p.avatar_url,
    p.bio,
    (u.email_confirmed_at IS NOT NULL) AS confirmed,
    (
      p.avatar_url IS NOT NULL
      OR (p.bio IS NOT NULL AND length(trim(p.bio)) > 0)
      OR (p.sports IS NOT NULL AND array_length(p.sports, 1) > 0)
      OR EXISTS (SELECT 1 FROM public.posts po WHERE po.user_id = u.id)
    ) AS has_activity,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE lower(split_part(u.email, '@', 2)) = lower(_domain)
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_email_domain_stats() FROM public, anon;
REVOKE ALL ON FUNCTION public.get_users_by_email_domain(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_email_domain_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_by_email_domain(text) TO authenticated;