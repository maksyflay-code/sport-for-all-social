import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const posts = [
  {
    id: 1,
    author: "Ana Beatriz",
    avatar: "AB",
    role: "Atleta Paralímpica 🏊‍♀️",
    time: "2h atrás",
    content: "Hoje completei meu primeiro 1km na natação adaptada! O caminho foi longo, mas cada braçada valeu a pena. Obrigada a toda comunidade pelo apoio! 💙🏅",
    likes: 234,
    comments: 45,
    color: "bg-secondary",
  },
  {
    id: 2,
    author: "Carlos Eduardo",
    avatar: "CE",
    role: "Treinador Inclusivo ⚽",
    time: "5h atrás",
    content: "Nosso time de futebol de cegos conquistou o campeonato regional! Prova de que quando damos oportunidade, o talento aparece. Vem pro treino! 🥅⚽",
    likes: 567,
    comments: 89,
    color: "bg-primary",
  },
  {
    id: 3,
    author: "Maria Silva",
    avatar: "MS",
    role: "Voluntária 🤝",
    time: "8h atrás",
    content: "Organizamos uma corrida inclusiva no parque da cidade e apareceram 200 pessoas! Cadeirantes, idosos, crianças... todos correndo (ou rolando!) juntos. Isso é Cidadelas 360! 🏃‍♀️🦽",
    likes: 891,
    comments: 123,
    color: "bg-accent",
  },
];

const FeedSection = () => {
  return (
    <section id="feed" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-3">
            HISTÓRIAS QUE <span className="text-gradient">INSPIRAM</span>
          </h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Acompanhe as conquistas e histórias da nossa comunidade
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${post.color} flex items-center justify-center`}>
                    <span className="text-sm font-bold text-primary-foreground">{post.avatar}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{post.author}</h3>
                    <p className="text-xs text-muted-foreground">{post.role} · {post.time}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-card-foreground/90 font-body mb-5 leading-relaxed">{post.content}</p>

              <div className="flex items-center gap-6 pt-4 border-t border-border">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">
                  <Heart className="w-5 h-5" /> {post.likes}
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors text-sm font-semibold">
                  <MessageCircle className="w-5 h-5" /> {post.comments}
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors text-sm font-semibold ml-auto">
                  <Share2 className="w-5 h-5" /> Compartilhar
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeedSection;
