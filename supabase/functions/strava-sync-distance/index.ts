// Edge function: soma os km de TODAS as atividades Strava do usuário (corrida +
// caminhada + ciclismo) e grava em strava_distance, concedendo as badges
// sports_10/50/100 automaticamente.
//
// Modos:
//   POST { user_id } → sincroniza só esse usuário (usado pelo botão manual)
//   POST { all: true } → sincroniza todos os usuários conectados (usado pelo cron diário)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Esportes que contam para o "km acumulado". Foco em modalidades com distância.
const DISTANCE_SPORTS = new Set([
  "Run", "TrailRun", "VirtualRun",
  "Walk", "Hike",
  "Ride", "VirtualRide", "EBikeRide", "MountainBikeRide", "GravelRide",
  "Swim",
]);

async function refreshToken(supabase: any, userId: string, refreshTokenStr: string) {
  const clientId = Deno.env.get("STRAVA_CLIENT_ID")!;
  const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET")!;
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshTokenStr,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to refresh Strava token");
  await supabase.from("strava_tokens").update({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
  return data.access_token;
}

async function ensureValidToken(supabase: any, token: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (token.expires_at < now) {
    return await refreshToken(supabase, token.user_id, token.refresh_token);
  }
  return token.access_token;
}

async function fetchAllActivities(accessToken: string): Promise<any[]> {
  // Strava limita a 200 por página. Buscamos até 5 páginas (1000 atividades).
  const all: any[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) break;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) break;
    all.push(...arr);
    if (arr.length < 200) break; // última página
  }
  return all;
}

async function syncOne(supabase: any, token: any): Promise<{ user_id: string; total_km: number }> {
  const accessToken = await ensureValidToken(supabase, token);
  const activities = await fetchAllActivities(accessToken);
  // distance vem em metros
  const totalMeters = activities
    .filter((a) => DISTANCE_SPORTS.has(a.sport_type) || DISTANCE_SPORTS.has(a.type))
    .reduce((sum, a) => sum + (Number(a.distance) || 0), 0);
  const totalKm = +(totalMeters / 1000).toFixed(2);

  const { error } = await supabase.rpc("upsert_strava_distance", {
    _user_id: token.user_id,
    _total_km: totalKm,
  });
  if (error) throw error;
  return { user_id: token.user_id, total_km: totalKm };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (body.all === true) {
      // Modo cron: sincroniza todos
      const { data: tokens } = await supabase.from("strava_tokens").select("*");
      const results = [];
      for (const t of tokens || []) {
        try {
          results.push(await syncOne(supabase, t));
        } catch (e) {
          results.push({ user_id: t.user_id, error: (e as Error).message });
        }
      }
      return new Response(JSON.stringify({ synced: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = body.user_id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: token } = await supabase
      .from("strava_tokens").select("*").eq("user_id", userId).single();

    if (!token) {
      return new Response(JSON.stringify({ error: "Strava not connected" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await syncOne(supabase, token);
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
