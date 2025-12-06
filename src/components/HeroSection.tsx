import { Link } from 'react-router-dom';
import { Play, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Manga } from '@/types/manga';
import { triggerPopunder } from '@/utils/popunder';

interface HeroSectionProps {
  manga: Manga;
}

const HeroSection = ({ manga }: HeroSectionProps) => {
  const backgroundImage = manga.banner_url || manga.cover;

  return (
    <section className="relative w-full min-h-[500px] md:min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt={manga.title}
          className="w-full h-full object-cover object-top blur-sm"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10 flex flex-col justify-end min-h-[500px] md:min-h-[600px] pb-12 pt-32">
        <div className="max-w-2xl space-y-4 animate-fade-in">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">
              Em Destaque
            </Badge>
            <Badge variant="ghost">
              {manga.chapters} capítulos
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight">
            {manga.title}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground text-sm md:text-base line-clamp-3 max-w-xl">
            {manga.description}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              {manga.type}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {manga.views >= 1000000 ? `${(manga.views / 1000000).toFixed(1)}M` : `${(manga.views / 1000).toFixed(0)}K`} visualizações
            </span>
            <span>{manga.status}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Link to={`/manga/${manga.id}/ler/1`} onClick={triggerPopunder}>
              <Button variant="default" size="lg" className="gap-2">
                <Play className="h-4 w-4" fill="currentColor" />
                Começar a Ler
              </Button>
            </Link>
            <Link to={`/manga/${manga.id}`} onClick={triggerPopunder}>
              <Button variant="outline" size="lg" className="gap-2">
                Ver Detalhes
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
