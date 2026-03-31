import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Activity, Link2, Unlink, Timer, Ruler, TrendingUp } from "lucide-react";

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  average_speed: number;
  total_elevation_gain: number;
}

const sportEmoji: Record<string, string> = {
  Run: "🏃", Ride: "🚴", Swim: "🏊", Walk: "🚶", Hike: "🥾",
  WeightTraining: "🏋️", Yoga: "🧘", Workout: "💪", Soccer: "⚽",
  Tennis: "🎾", Rowing: "🚣", Surfing: "🏄", CrossFit: "🏋️",
};

const formatDistance = (m: number) => (m / 1000).toFixed(2) + " km";
const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};
const formatPace = (speed: number) => {
  if (!speed) return "--";
  const paceMinKm = 1000 / speed / 60;
  const mins = Math.floor(paceMinKm);
  const secs = Math.round((paceMinKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /km`;
};

export const useStravaConnection = () => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) checkConnection();
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("strava_tokens")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    setConnected(!!data);
    setLoading(false);
  };

  return { connected, loading, recheckConnection: checkConnection };
};

export const StravaConnectButton = () => {
  const { user } = useAuth();
  const { connected, loading, recheckConnection } = useStravaConnection();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Handle OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const scope = params.get("scope");
    console.log("Strava OAuth check:", { code: !!code, scope, userId: user?.id });
    if (code && user) {
      console.log("Strava OAuth callback detected, processing...");
      handleCallback(code);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [user]);

  const handleConnect = async () => {
    try {
      const { data } = await supabase.functions.invoke("strava-config");
      const clientId = data?.client_id;
      if (!clientId) { toast.error("Strava não configurado"); return; }
      const redirectUri = window.location.origin + "/profile";
      const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=activity:read_all&approval_prompt=auto`;
      window.location.href = url;
    } catch {
      toast.error("Erro ao iniciar conexão com Strava");
    }
  };

  const handleCallback = async (code: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("strava-auth", {
        body: { code, user_id: user!.id },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Strava conectado com sucesso!");
        recheckConnection();
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (err: any) {
      toast.error("Erro ao conectar Strava: " + (err.message || ""));
    } finally {
      setProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    await supabase.from("strava_tokens").delete().eq("user_id", user.id);
    toast.success("Strava desconectado");
    recheckConnection();
  };

  if (loading) return null;

  return connected ? (
    <div className="flex items-center gap-2">
      <span className="text-xs text-green-400 flex items-center gap-1">
        <Link2 className="w-3 h-3" /> Strava conectado
      </span>
      <button onClick={handleDisconnect} className="text-xs text-white/30 hover:text-red-400 transition-colors flex items-center gap-1">
        <Unlink className="w-3 h-3" /> Desconectar
      </button>
    </div>
  ) : (
    <Button
      onClick={handleConnect}
      disabled={processing}
      className="rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-semibold text-sm h-9 gap-2"
    >
      <Activity className="w-4 h-4" />
      {processing ? "Conectando..." : "Conectar Strava"}
    </Button>
  );
};

export const StravaActivities = ({ onPost }: { onPost: (content: string) => void }) => {
  const { user } = useAuth();
  const { connected } = useStravaConnection();
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const loadActivities = async () => {
    if (!user || !connected) return;
    setLoading(true);
    try {
      console.log("Fetching Strava activities for user:", user.id);
      const { data, error } = await supabase.functions.invoke("strava-activities", {
        body: { user_id: user.id },
      });
      console.log("Strava activities response:", data, error);
      if (error) throw error;
      if (data?.error) {
        console.error("Strava API error:", data.error);
        toast.error("Erro Strava: " + data.error);
        return;
      }
      setActivities(data?.activities || []);
    } catch (err: any) {
      console.error("Strava activities error:", err);
      toast.error("Erro ao carregar atividades do Strava");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected) {
      console.log("Strava connected, loading activities...");
      loadActivities();
    } else {
      console.log("Strava not connected, skipping activities load");
    }
  }, [connected]);

  if (!connected) return null;

  const shareActivity = (activity: StravaActivity) => {
    const emoji = sportEmoji[activity.type] || "🏅";
    const content = `${emoji} ${activity.name}\n\n📏 Distância: ${formatDistance(activity.distance)}\n⏱️ Tempo: ${formatTime(activity.moving_time)}\n⚡ Pace: ${formatPace(activity.average_speed)}\n⛰️ Elevação: ${activity.total_elevation_gain}m\n\n#Strava #${activity.type}`;
    onPost(content);
  };

  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#FC4C02]" /> Atividades Strava
        </h3>
        <button onClick={loadActivities} disabled={loading} className="text-xs text-white/40 hover:text-white transition-colors">
          {loading ? "Carregando..." : "Atualizar"}
        </button>
      </div>

      {activities.length === 0 && !loading && (
        <p className="text-xs text-white/30 text-center py-4">Nenhuma atividade recente</p>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {activities.map((a) => (
          <div key={a.id} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-[#FC4C02]/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <span>{sportEmoji[a.type] || "🏅"}</span> {a.name}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {formatDistance(a.distance)}</span>
                  <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {formatTime(a.moving_time)}</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {a.total_elevation_gain}m</span>
                </div>
              </div>
              <button
                onClick={() => shareActivity(a)}
                className="text-xs text-[#FC4C02] hover:text-[#E34402] font-semibold transition-colors shrink-0 ml-2"
              >
                Postar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
