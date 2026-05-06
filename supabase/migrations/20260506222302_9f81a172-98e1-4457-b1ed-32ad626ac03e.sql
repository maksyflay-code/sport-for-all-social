
CREATE OR REPLACE FUNCTION public.require_real_display_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name text;
  _clean text;
BEGIN
  SELECT display_name INTO _name FROM public.profiles WHERE user_id = NEW.user_id;
  _clean := trim(coalesce(_name, ''));

  IF length(_clean) < 3 THEN
    RAISE EXCEPTION 'Você precisa ter um nome real no perfil para participar (mínimo 3 caracteres).';
  END IF;

  -- exige pelo menos duas palavras (nome e sobrenome) com letras
  IF array_length(regexp_split_to_array(_clean, '\s+'), 1) < 2 THEN
    RAISE EXCEPTION 'Use seu nome e sobrenome reais no perfil para poder publicar ou comentar.';
  END IF;

  -- precisa conter letras (não apenas números/símbolos)
  IF _clean !~ '[A-Za-zÀ-ÿ]' THEN
    RAISE EXCEPTION 'Nome de perfil inválido. Use letras reais.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_real_name_posts ON public.posts;
CREATE TRIGGER enforce_real_name_posts
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.require_real_display_name();

DROP TRIGGER IF EXISTS enforce_real_name_comments ON public.comments;
CREATE TRIGGER enforce_real_name_comments
BEFORE INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.require_real_display_name();

DROP TRIGGER IF EXISTS enforce_real_name_community_posts ON public.community_posts;
CREATE TRIGGER enforce_real_name_community_posts
BEFORE INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.require_real_display_name();

DROP TRIGGER IF EXISTS enforce_real_name_messages ON public.messages;
CREATE TRIGGER enforce_real_name_messages
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.require_real_display_name();
