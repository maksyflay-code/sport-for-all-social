-- 1) Selo verificado em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- Política: apenas admins podem alterar is_verified.
-- A política existente "Users can update their own profile" permite o user editar
-- seus próprios campos. Adicionamos uma trigger de proteção para impedir que
-- usuários comuns mudem is_verified em si próprios.
CREATE OR REPLACE FUNCTION public.protect_is_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o selo verificado';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_is_verified ON public.profiles;
CREATE TRIGGER trg_protect_is_verified
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_is_verified();

-- 2) Tabela de distância acumulada do Strava
CREATE TABLE IF NOT EXISTS public.strava_distance (
  user_id uuid PRIMARY KEY,
  total_km numeric NOT NULL DEFAULT 0,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strava_distance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Strava distance viewable by everyone"
  ON public.strava_distance FOR SELECT
  USING (true);

-- Sem políticas de INSERT/UPDATE/DELETE para usuários: somente service role
-- (edge function) pode escrever, garantindo integridade.

CREATE TRIGGER update_strava_distance_updated_at
  BEFORE UPDATE ON public.strava_distance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Função utilitária chamada pela edge function para gravar km e conceder badges
CREATE OR REPLACE FUNCTION public.upsert_strava_distance(_user_id uuid, _total_km numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.strava_distance (user_id, total_km, last_synced_at)
  VALUES (_user_id, _total_km, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_km = EXCLUDED.total_km,
        last_synced_at = now();

  IF _total_km >= 10  THEN PERFORM public.grant_badge(_user_id, 'sports_10');  END IF;
  IF _total_km >= 50  THEN PERFORM public.grant_badge(_user_id, 'sports_50');  END IF;
  IF _total_km >= 100 THEN PERFORM public.grant_badge(_user_id, 'sports_100'); END IF;
END;
$$;