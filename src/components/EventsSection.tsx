import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const events = [
  {
    title: "Maratona Inclusiva SP",
    date: "15 Abr 2026",
    location: "Parque Ibirapuera, SP",
    spots: 120,
    tag: "Corrida",
  },
  {
    title: "Torneio de Basquete Adaptado",
    date: "22 Abr 2026",
    location: "Ginásio Municipal, RJ",
    spots: 48,
    tag: "Basquete",
  },
  {
    title: "Festival de Natação para Todos",
    date: "05 Mai 2026",
    location: "Centro Aquático, BH",
    spots: 200,
    tag: "Natação",
  },
];

const EventsSection = () => {
  return (
    <section id="eventos" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-3">
            PRÓXIMOS <span className="text-gradient">EVENTOS</span>
          </h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Participe de eventos que celebram a diversidade no esporte
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {events.map((event, i) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl overflow-hidden shadow-card border border-border hover:shadow-elevated transition-shadow group"
            >
              <div className="gradient-hero h-2" />
              <div className="p-6">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                  {event.tag}
                </span>
                <h3 className="font-display text-2xl text-card-foreground mb-4">{event.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-secondary" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    {event.spots} vagas restantes
                  </div>
                </div>
                <Button className="w-full gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                  Inscrever-se
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
