import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, BookOpen, Crown, LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const navLinks = [
    { name: 'Início', path: '/' },
    { name: 'Catálogo', path: '/catalogo' },
    { name: 'VIP', path: '/vip', icon: Crown },
    { name: 'Discord', path: '/discord' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <BookOpen className="h-6 w-6" />
          <span>HavenComics</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground",
                isActive(link.path) ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {link.icon && <link.icon className="h-4 w-4 text-warning" />}
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className={cn(
            "hidden md:flex items-center transition-all duration-300",
            isSearchOpen ? "w-64" : "w-auto"
          )}>
            {isSearchOpen ? (
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  className="pl-9 pr-9"
                  autoFocus
                  onBlur={() => setIsSearchOpen(false)}
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/perfil">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Settings className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <Link to="/entrar">
              <Button variant="outline" className="hidden md:flex">
                Entrar
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-in">
          <div className="container py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por título..." className="pl-9" />
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(link.path)
                      ? "bg-secondary text-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  {link.icon && <link.icon className="h-4 w-4 text-warning" />}
                  {link.name}
                </Link>
              ))}
              {user && (
                <Link
                  to="/perfil"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive('/perfil')
                      ? "bg-secondary text-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <User className="h-4 w-4" />
                  Meu Perfil
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive('/admin')
                      ? "bg-secondary text-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </nav>

            {/* Mobile Login/Logout */}
            {user ? (
              <Button variant="outline" className="w-full gap-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            ) : (
              <Link to="/entrar" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
