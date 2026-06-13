import Header from "@/components/Header";
import FeedSection from "@/components/FeedSection";
import StoriesBar from "@/components/StoriesBar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/useEvents";
import { Users, Calendar, FileText, ArrowRight } from "lucide-react";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-sports.jpg";
import logoCidadelas from "@/assets/logo.jpeg";

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

const formatEventDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

// Landing page for non-logged users
const LandingPage = () => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const stats = usePlatformStats();

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoCidadelas} alt="Cidadelas 360" className="w-12 h-12 rounded-full object-cover shadow-lg" />
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
              <p className="text-3xl font-black text-white">{stats.athletes}</p>
              <p className="text-sm text-white/50">Atletas</p>
            </div>
            <div className="text-center">
              <FileText className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-black text-white">{stats.posts}</p>
              <p className="text-sm text-white/50">Publicações</p>
            </div>
            <div className="text-center">
              <Calendar className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-black text-white">{stats.events}</p>
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

      {/* Events - Dynamic from DB */}
      <section className="py-16 bg-[#1a1a2e]">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl font-extrabold text-white text-center mb-8">
            Próximos <span className="text-orange-400">Eventos</span>
          </h2>
          <div className="space-y-3">
            {events.length > 0 ? events.map((event) => (
              <div key={event.id} className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:border-orange-400/20 transition-colors cursor-pointer">
                <span className="text-2xl">{event.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{event.title}</p>
                  <p className="text-xs text-white/50">
                    {formatEventDate(event.event_date)}
                    {event.location && ` • ${event.location}`}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </div>
            )) : (
              <p className="text-center text-white/30 text-sm">Nenhum evento próximo</p>
            )}
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
        <div className="container mx-auto px-4 text-center space-y-2">
          <div className="text-xs text-white/30 space-x-3">
            <span>© 2026 Cidadelas 360</span>
            <a href="#" className="hover:text-white/60 transition-colors">Sobre</a>
            <a href="#" className="hover:text-white/60 transition-colors">Termos</a>
            <a href="#" className="hover:text-white/60 transition-colors">Privacidade</a>
          </div>
          <p className="text-xs text-white/40">
            Desenvolvido por{" "}
            <a href="https://www.linkedin.com/in/maksyflay/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
              Maksyflay Souza
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

// Feed page for logged-in users
const FeedPage = () => {
  return (
    <div className="feed-light min-h-screen bg-[#f0f2f5]">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="xl:grid xl:grid-cols-[260px_minmax(0,1fr)_300px] xl:gap-6 xl:max-w-[1280px] xl:mx-auto">
          {/* Coluna esquerda — só ≥xl */}
          <div className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <LeftSidebar />
            </div>
          </div>

          {/* Coluna central */}
          <div className="max-w-2xl mx-auto xl:mx-0 w-full space-y-6">
          <StoriesBar />
          <FeedSection />

          {/* Footer */}
          <div className="text-center py-6 space-y-2">
            <div className="text-xs text-white/30 space-x-3">
              <span>© 2026 Cidadelas 360</span>
              <a href="#" className="hover:text-white/60 transition-colors">Sobre</a>
              <a href="#" className="hover:text-white/60 transition-colors">Termos</a>
              <a href="#" className="hover:text-white/60 transition-colors">Privacidade</a>
            </div>
            <p className="text-xs text-white/40">
              Desenvolvido por{" "}
              <a href="https://www.linkedin.com/in/maksyflay/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                Maksyflay Souza
              </a>
            </p>
          </div>
          </div>
          {/* fim coluna central */}

          {/* Coluna direita — só ≥xl */}
          <div className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <RightSidebar />
            </div>
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
