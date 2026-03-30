import Header from "@/components/Header";
import FeedSection from "@/components/FeedSection";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Calendar, Trophy, Flame, TrendingUp } from "lucide-react";

const trendingTopics = [
  { label: "Futebol", count: "12.5k posts", emoji: "⚽" },
  { label: "Basquete", count: "8.3k posts", emoji: "🏀" },
  { label: "Natação", count: "5.1k posts", emoji: "🏊" },
  { label: "Vôlei", count: "4.7k posts", emoji: "🏐" },
  { label: "Corrida", count: "3.9k posts", emoji: "🏃" },
  { label: "Tênis", count: "3.2k posts", emoji: "🎾" },
  { label: "Ciclismo", count: "2.8k posts", emoji: "🚴" },
  { label: "Artes Marciais", count: "2.5k posts", emoji: "🥋" },
  { label: "Musculação", count: "2.3k posts", emoji: "🏋️" },
  { label: "Surfe", count: "1.9k posts", emoji: "🏄" },
];

const upcomingEvents = [
  { title: "Maratona Inclusiva SP", date: "15 Abr", emoji: "🏅" },
  { title: "Torneio de Futebol Society", date: "20 Abr", emoji: "⚽" },
  { title: "Campeonato de Natação", date: "22 Abr", emoji: "🏊" },
  { title: "Copa de Vôlei Misto", date: "28 Abr", emoji: "🏐" },
  { title: "Corrida de Rua 10km", date: "05 Mai", emoji: "🏃" },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome banner for non-logged users */}
          {!user && (
            <div className="bg-primary rounded-2xl p-6 text-primary-foreground animate-fade-in">
              <h1 className="text-2xl font-extrabold tracking-tight mb-1">
                Bem-vindo ao Cidadelas 360 ⚡
              </h1>
              <p className="text-primary-foreground/80 text-sm">
                A rede social de inclusão no esporte. Conecte-se, compartilhe e celebre cada conquista.
              </p>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl p-4 shadow-card text-center animate-fade-in">
              <Users className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-lg font-bold text-foreground">4.2k</p>
              <p className="text-xs text-muted-foreground">Membros</p>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-card text-center animate-fade-in">
              <Trophy className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-lg font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Comunidades</p>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-card text-center animate-fade-in">
              <Calendar className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-lg font-bold text-foreground">8</p>
              <p className="text-xs text-muted-foreground">Eventos</p>
            </div>
          </div>

          {/* Feed */}
          <FeedSection />

          {/* Trending sidebar as inline cards on mobile-friendly layout */}
          <div className="bg-card rounded-2xl shadow-card p-5 animate-fade-in">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-primary" /> Em alta
            </h3>
            <div className="space-y-3">
              {trendingTopics.map((topic) => (
                <div key={topic.label} className="flex items-center gap-3 group cursor-pointer">
                  <span className="text-xl">{topic.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{topic.label}</p>
                    <p className="text-xs text-muted-foreground">{topic.count}</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="bg-card rounded-2xl shadow-card p-5 animate-fade-in">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" /> Próximos eventos
            </h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.title} className="flex items-center gap-3 group cursor-pointer">
                  <span className="text-xl">{event.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer inline */}
          <div className="text-center py-6 text-xs text-muted-foreground space-x-3">
            <span>© 2026 Cidadelas 360</span>
            <a href="#" className="hover:text-foreground transition-colors">Sobre</a>
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
