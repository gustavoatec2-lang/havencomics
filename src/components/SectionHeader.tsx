import { Link } from 'react-router-dom';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
}

const SectionHeader = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  viewAllLink,
  viewAllText = "Ver todos"
}: SectionHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <h2 className="text-xl md:text-2xl font-display font-bold">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {viewAllLink && (
        <Link to={viewAllLink}>
          <Button variant="outline" size="sm" className="gap-1 flex-shrink-0">
            {viewAllText}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
