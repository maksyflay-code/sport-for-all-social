import Header from "@/components/Header";
import FeedSection from "@/components/FeedSection";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, Trophy, Flame, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-sports.jpg";
import logoCidadelas from "@/assets/logo.jpeg";

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

const sports = [
  { name: "Futebol", emoji: "⚽" },
  { name: "Basquete", emoji: "🏀" },
  { name: "Natação", emoji: "🏊" },
  { name: "Vôlei", emoji: "🏐" },
  { name: "Tênis", emoji: "🎾" },
  { name: "Corrida", emoji: "🏃" },
  { name: "Ciclismo", emoji: "🚴" },
  { name: "Artes Marciais", emoji: "🥋" },
  { name: "Surfe", emoji: "🏄" },
  { name: "Musculação", emoji: "🏋️" },
  { name: "Skate", emoji: "🛹" },
  { name: "Handbol", emoji: "🤾" },
];

// Landing page for non-logged users
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoCidadelas} alt="Cidadelas 360" className="w-9 h-9 rounded-xl object-cover" />
            <span className="text-lg font-extrabold tracking-tight text-white">
              CIDADELAS <span className="text-orange-400">360</span>
            </span>
          </div>
          <Button
            onClick={() => navigate("/auth")}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Esporte inclusivo" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/70 to-[#1a1a2e]/40" />
        </div>
        <div className="relative z-10 container mx-auto px-4 pt-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-orange-400/20">
              🏅 Inclusão no Esporte para Todos
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] mb-5">
              O ESPORTE É{" "}
              <span className="text-orange-400">DE TODOS</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              Conecte-se com comunidades esportivas inclusivas. Compartilhe histórias, encontre eventos e celebre cada vitória — grande ou pequena.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate("/auth")}
                className="h-12 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base gap-2"
              >
                Junte-se à Comunidade <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="h-12 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base"
              >
                Explorar Eventos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#1a1a2e]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <Users className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-black text-white">4.2k</p>
              <p className="text-sm text-white/50">Membros</p>
            </div>
            <div className="text-center">
              <Trophy className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-black text-white">12</p>
              <p className="text-sm text-white/50">Comunidades</p>
            </div>
            <div className="text-center">
              <Calendar className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-black text-white">8</p>
              <p className="text-sm text-white/50">Eventos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sports */}
      <section className="py-16 bg-[#16162a]">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-white text-center mb-8">
            Esportes para <span className="text-orange-400">Todos</span>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-3xl mx-auto">
            {sports.map((s) => (
              <div key={s.name} className="bg-white/5 rounded-2xl p-4 text-center hover:bg-orange-500/10 transition-colors cursor-pointer border border-white/5 hover:border-orange-400/20">
                <span className="text-3xl">{s.emoji}</span>
                <p className="text-xs font-semibold text-white/70 mt-2">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="py-16 bg-[#1a1a2e]">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl font-extrabold text-white text-center mb-8">
            Próximos <span className="text-orange-400">Eventos</span>
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.title} className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:border-orange-400/20 transition-colors cursor-pointer">
                <span className="text-2xl">{event.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{event.title}</p>
                  <p className="text-xs text-white/50">{event.date}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-[#16162a] to-[#1a1a2e]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Pronto para fazer parte?</h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">Cadastre-se gratuitamente e conecte-se com milhares de atletas e entusiastas do esporte.</p>
          <Button
            onClick={() => navigate("/auth")}
            className="h-12 px-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base gap-2"
          >
            Criar Conta Grátis <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="container mx-auto px-4 text-center text-xs text-white/30 space-x-3">
          <span>© 2026 Cidadelas 360</span>
          <a href="#" className="hover:text-white/60 transition-colors">Sobre</a>
          <a href="#" className="hover:text-white/60 transition-colors">Termos</a>
          <a href="#" className="hover:text-white/60 transition-colors">Privacidade</a>
        </div>
      </footer>
    </div>
  );
};

// Feed page for logged-in users
const FeedPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
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

          {/* Feed - only for logged users */}
          <FeedSection />

          {/* Trending */}
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

          {/* Footer */}
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

const Index = () => {
  const { user } = useAuth();
  return user ? <FeedPage /> : <LandingPage />;
};

export default Index;
