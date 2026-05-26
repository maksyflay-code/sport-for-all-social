import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user_id = userData.user.id;

    const { data: tokenData } = await supabase
      .from("strava_tokens")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Strava not connected" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token expired
    let accessToken = tokenData.access_token;
    const now = Math.floor(Date.now() / 1000);
    if (tokenData.expires_at < now) {
      accessToken = await refreshToken(supabase, user_id, tokenData.refresh_token);
    }

    // Fetch recent activities
    const activitiesRes = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=10",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const activities = await activitiesRes.json();

    if (!Array.isArray(activities)) {
      return new Response(JSON.stringify({ error: "Failed to fetch activities" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formatted = activities.map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      sport_type: a.sport_type,
      distance: a.distance,
      moving_time: a.moving_time,
      elapsed_time: a.elapsed_time,
      start_date: a.start_date_local,
      average_speed: a.average_speed,
      max_speed: a.max_speed,
      total_elevation_gain: a.total_elevation_gain,
      kudos_count: a.kudos_count,
    }));

    return new Response(JSON.stringify({ activities: formatted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
