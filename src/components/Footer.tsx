import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
              <BookOpen className="h-6 w-6 text-primary" />
              <span>HavenComics</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Sua plataforma para ler mangá, manhwa e manhua online.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-semibold">Navegação</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/catalogo" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Catálogo
              </Link>
              <Link to="/catalogo?type=manga" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Mangá
              </Link>
              <Link to="/catalogo?type=manhwa" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Manhwa
              </Link>
              <Link to="/catalogo?type=manhua" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Manhua
              </Link>
            </nav>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="font-semibold">Conta</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/entrar" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Entrar
              </Link>
              <Link to="/entrar?tab=register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Registrar
              </Link>
              <Link to="/biblioteca" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Biblioteca
              </Link>
              <Link to="/favoritos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Favoritos
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/sobre" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sobre
              </Link>
              <Link to="/termos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos
              </Link>
              <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacidade
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 HavenComics. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
