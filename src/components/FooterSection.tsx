import { Heart } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-foreground text-primary-foreground/80 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
                <span className="font-display text-primary-foreground text-sm">C</span>
              </div>
              <span className="font-display text-xl text-primary-foreground">CIDADELAS 360</span>
            </div>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              Conectando pessoas através do esporte inclusivo. Porque todo mundo merece jogar.
            </p>
          </div>

          {[
            { title: "Plataforma", links: ["Feed", "Comunidades", "Eventos", "Histórias"] },
            { title: "Suporte", links: ["Central de Ajuda", "Acessibilidade", "Contato", "Denunciar"] },
            { title: "Legal", links: ["Termos de Uso", "Privacidade", "Cookies", "Licenças"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-lg text-primary-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-primary-foreground/50 hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            © 2026 Cidadelas 360. Todos os direitos reservados.
          </p>
          <p className="text-xs text-primary-foreground/40 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-primary" /> para um esporte mais inclusivo
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
