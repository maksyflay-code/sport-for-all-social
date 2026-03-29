import { motion } from "framer-motion";
import { ArrowRight, Users, Trophy, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-inclusion.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Pessoas diversas praticando esportes juntas"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-semibold mb-6 backdrop-blur-sm border border-primary/30">
            🏅 Inclusão no Esporte para Todos
          </span>

          <h1 className="text-5xl md:text-7xl font-display text-primary-foreground leading-none mb-6">
            O ESPORTE É<br />
            <span className="text-gradient">DE TODOS</span>
          </h1>

          <p className="text-lg text-primary-foreground/80 font-body mb-8 max-w-lg">
            Conecte-se com comunidades esportivas inclusivas. Compartilhe histórias, 
            encontre eventos e celebre cada vitória — grande ou pequena.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Button size="lg" className="gradient-hero text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity gap-2">
              Junte-se à Comunidade <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-base">
              Explorar Eventos
            </Button>
          </div>

          <div className="flex gap-8">
            {[
              { icon: Users, label: "Atletas", value: "12K+" },
              { icon: Trophy, label: "Eventos", value: "350+" },
              { icon: Heart, label: "Comunidades", value: "80+" },
            ].map(({ icon: Icon, label, value }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-center"
              >
                <Icon className="w-6 h-6 text-accent mx-auto mb-1" />
                <p className="text-2xl font-display text-primary-foreground">{value}</p>
                <p className="text-xs text-primary-foreground/60">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
