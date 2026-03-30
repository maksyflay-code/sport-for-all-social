import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  event_date: string;
  location: string | null;
}

export const useEvents = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })
      .limit(10);
    setEvents((data as EventItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, []);

  return { events, loading, reload: loadEvents };
};
