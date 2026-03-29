import { Users, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const communities = [
  { name: "Natação Adaptada", members: 1240, emoji: "🏊" },
  { name: "Basquete em Cadeira", members: 890, emoji: "🏀" },
  { name: "Corrida Inclusiva", members: 2100, emoji: "🏃" },
];

const events = [
  { title: "Maratona Inclusiva SP", date: "15 Abr", spots: 120 },
  { title: "Torneio Basquete Adaptado", date: "22 Abr", spots: 48 },
];

const contacts = [
  { name: "Ana Beatriz", emoji: "🏊‍♀️" },
  { name: "Carlos Eduardo", emoji: "⚽" },
  { name: "Maria Silva", emoji: "🤝" },
  { name: "João Santos", emoji: "🏀" },
  { name: "Fernanda Lima", emoji: "🏃‍♀️" },
];

const RightSidebar = () => {
  return (
    <aside className="hidden xl:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-4 pl-2">
      {/* Suggested Communities */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-3 mb-2">
          <h3 className="text-[17px] font-bold text-foreground">Comunidades sugeridas</h3>
        </div>
        <div className="space-y-0.5">
          {communities.map((c) => (
            <div key={c.name} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-lg">
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.members.toLocaleString()} membros</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-3 mb-2">
          <h3 className="text-[17px] font-bold text-foreground">Próximos eventos</h3>
        </div>
        <div className="space-y-0.5">
          {events.map((e) => (
            <div key={e.title} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <Calendar className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.date} · {e.spots} vagas</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contacts */}
      <div>
        <div className="flex items-center justify-between px-3 mb-2">
          <h3 className="text-[17px] font-bold text-foreground">Contatos</h3>
        </div>
        <div className="space-y-0.5">
          {contacts.map((c) => (
            <div key={c.name} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                {c.emoji}
              </div>
              <span className="text-[13px] font-medium text-foreground">{c.name}</span>
              <div className="ml-auto w-2.5 h-2.5 rounded-full bg-success" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
