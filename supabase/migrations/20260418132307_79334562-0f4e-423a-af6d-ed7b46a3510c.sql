-- Backfill badges retroativas para usuários que já cumpriram os marcos
-- antes da Fase 2 ter sido implantada.
DO $$
DECLARE
  r record;
BEGIN
  -- Posts
  FOR r IN SELECT user_id, count(*) AS c FROM public.posts GROUP BY user_id LOOP
    IF r.c >= 1   THEN PERFORM public.grant_badge(r.user_id, 'posts_1');   END IF;
    IF r.c >= 10  THEN PERFORM public.grant_badge(r.user_id, 'posts_10');  END IF;
    IF r.c >= 50  THEN PERFORM public.grant_badge(r.user_id, 'posts_50');  END IF;
    IF r.c >= 100 THEN PERFORM public.grant_badge(r.user_id, 'posts_100'); END IF;
  END LOOP;

  -- Seguidores
  FOR r IN SELECT following_id AS user_id, count(*) AS c FROM public.follows GROUP BY following_id LOOP
    IF r.c >= 10  THEN PERFORM public.grant_badge(r.user_id, 'social_10');  END IF;
    IF r.c >= 50  THEN PERFORM public.grant_badge(r.user_id, 'social_50');  END IF;
    IF r.c >= 100 THEN PERFORM public.grant_badge(r.user_id, 'social_100'); END IF;
  END LOOP;
END $$;