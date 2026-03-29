import { motion } from "framer-motion";
import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const communities = [
  { name: "Natação Adaptada", members: 1240, emoji: "🏊", color: "from-secondary to-secondary/70" },
  { name: "Basquete em Cadeira", members: 890, emoji: "🏀", color: "from-primary to-primary/70" },
  { name: "Corrida Inclusiva", members: 2100, emoji: "🏃", color: "from-accent to-accent/70" },
  { name: "Futebol de Cegos", members: 650, emoji: "⚽", color: "from-secondary to-primary/70" },
  { name: "Vôlei Sentado", members: 430, emoji: "🏐", color: "from-primary to-accent/70" },
  { name: "Atletismo Para Todos", members: 1780, emoji: "🏅", color: "from-accent to-secondary/70" },
];

const CommunitiesSection = () => {
  return (
    <section id="comunidades" className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-3">
            NOSSAS <span className="text-gradient">COMUNIDADES</span>
          </h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Encontre seu esporte, sua turma, seu lugar
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {communities.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl mb-4`}>
                {c.emoji}
              </div>
              <h3 className="font-display text-xl text-card-foreground mb-1">{c.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                <Users className="w-4 h-4" />
                <span>{c.members.toLocaleString()} membros</span>
              </div>
              <Button variant="ghost" size="sm" className="text-primary font-semibold hover:text-primary/80 p-0 gap-1 group-hover:gap-2 transition-all">
                Participar <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitiesSection;
