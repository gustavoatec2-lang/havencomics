import { Link } from 'react-router-dom';
import { Manga } from '@/types/manga';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MangaCardProps {
  manga: Manga;
  showRank?: number;
  variant?: 'default' | 'compact' | 'horizontal';
}

const MangaCard = ({ manga, showRank, variant = 'default' }: MangaCardProps) => {
  const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
    'Em Andamento': 'success',
    'Completo': 'info',
    'Hiato': 'warning',
    'Cancelado': 'destructive',
  };

  if (variant === 'horizontal') {
    return (
      <Link
        to={`/manga/${manga.id}`}
        className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-secondary transition-all duration-200 group"
      >
        {showRank && (
          <span className="text-2xl font-bold text-muted-foreground w-8 text-center">
            {showRank}
          </span>
        )}
        <div className="relative w-14 h-20 rounded-md overflow-hidden flex-shrink-0">
          <img
            src={manga.cover}
            alt={manga.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {manga.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="ghost" className="text-xs">
              {manga.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {manga.chapters} caps
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 text-warning">
            <span className="text-sm">★</span>
            <span className="text-sm font-medium">{manga.rating.toFixed(1)}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            👁 {manga.views >= 1000000 ? `${(manga.views / 1000000).toFixed(1)}M` : manga.views >= 1000 ? `${(manga.views / 1000).toFixed(0)}K` : manga.views}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/manga/${manga.id}`}
      className={cn(
        "group relative block rounded-lg overflow-hidden bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        variant === 'compact' && "aspect-[3/4]"
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4.5] overflow-hidden">
        <img
          src={manga.cover}
          alt={manga.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Type Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
        >
          {manga.type}
        </Badge>

        {/* Highlight Badge */}
        {manga.isHighlight && (
          <Badge 
            variant="warning" 
            className="absolute top-2 left-2"
          >
            Destaque
          </Badge>
        )}

        {/* Status Badge */}
        <Badge 
          variant={statusColors[manga.status]} 
          className="absolute bottom-2 left-2"
        >
          {manga.status}
        </Badge>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {manga.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {manga.author} • {manga.chapters} caps
        </p>
      </div>
    </Link>
  );
};

export default MangaCard;
