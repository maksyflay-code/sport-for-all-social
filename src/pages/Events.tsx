import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/hooks/useEvents";
import Header from "@/components/Header";
import RsvpButtons from "@/components/RsvpButtons";
import { Calendar, MapPin } from "lucide-react";

const formatEventDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
};

const Events = () => {
  const { user, loading: authLoading } = useAuth();
  const { events, loading } = useEvents();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-7 h-7 text-orange-400" />
          <h1 className="text-2xl font-extrabold text-white">Eventos</h1>
        </div>

        {loading && <p className="text-white/40 text-sm">Carregando...</p>}

        {!loading && events.length === 0 && (
          <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/5">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 font-semibold">Nenhum evento próximo</p>
            <p className="text-xs text-white/40 mt-1">Aguarde novos eventos da comunidade.</p>
          </div>
        )}

        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="bg-white/5 rounded-2xl p-5 border border-white/5">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{event.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white">{event.title}</h3>
                  <p className="text-xs text-orange-300 font-semibold mt-1 capitalize">
                    {formatEventDate(event.event_date)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-sm text-white/70 mt-2">{event.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">Você vai?</p>
                <RsvpButtons eventId={event.id} compact />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
