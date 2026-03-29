import { Heart } from "lucide-react";
import logoCidadelas from "@/assets/logo-cidadelas.jpeg";

const FooterSection = () => {
  return (
    <footer className="bg-card border-t border-border py-6 mt-0">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoCidadelas} alt="Cidadelas 360" className="w-6 h-6 rounded-full object-cover" />
            <span className="text-sm font-bold text-foreground">Cidadelas 360</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:underline">Sobre</a>
            <a href="#" className="hover:underline">Termos</a>
            <a href="#" className="hover:underline">Privacidade</a>
            <a href="#" className="hover:underline">Acessibilidade</a>
            <a href="#" className="hover:underline">Ajuda</a>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            © 2026 Cidadelas 360
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
