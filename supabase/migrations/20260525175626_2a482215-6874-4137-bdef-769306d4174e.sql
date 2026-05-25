CREATE OR REPLACE FUNCTION public.is_valid_signup_name(_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    length(trim(coalesce(_name, ''))) >= 5
    AND trim(coalesce(_name, '')) ~ '[A-Za-zÀ-ÿ]'
    AND array_length(regexp_split_to_array(trim(coalesce(_name, '')), '\s+'), 1) >= 2
    AND trim(coalesce(_name, '')) !~ '[0-9]{3,}';
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _domain text;
  _display_name text;
BEGIN
  _domain := lower(split_part(coalesce(NEW.email, ''), '@', 2));

  IF _domain <> '' AND public.is_suspicious_email_domain(_domain) THEN
    RAISE EXCEPTION 'Este domínio de email não é aceito.';
  END IF;

  _display_name := trim(coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  ));

  IF NOT public.is_valid_signup_name(_display_name) THEN
    RAISE EXCEPTION 'Use seu nome e sobrenome reais para criar a conta.';
  END IF;

  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    _display_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );

  RETURN NEW;
END;
$$;