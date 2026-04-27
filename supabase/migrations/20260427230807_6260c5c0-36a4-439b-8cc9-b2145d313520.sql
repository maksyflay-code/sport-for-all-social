CREATE OR REPLACE FUNCTION public.is_suspicious_email_domain(_domain text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT lower(_domain) = ANY (ARRAY[
    -- email descartável / temporário comum
    'mailinator.com','guerrillamail.com','tempmail.com','10minutemail.com',
    'trashmail.com','yopmail.com','sharklasers.com','throwawaymail.com',
    'maildrop.cc','getnada.com','dispostable.com','tempr.email',
    'fakeinbox.com','mintemail.com','mohmal.com','emailondeck.com',
    -- domínios detectados no banco do projeto
    'sixoplus.com','ryzid.com','pertok.com','mugstock.com',
    'deepmails.org','soppat.com','poisonword.com','example.com'
  ]);
$function$;