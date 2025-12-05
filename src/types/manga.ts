export interface Manga {
  id: string;
  title: string;
  cover: string;
  cover_url?: string | null;
  type: 'Mangá' | 'Manhwa' | 'Manhua' | 'manga' | 'manhwa' | 'manhua' | 'novel' | 'webtoon';
  status: 'Em Andamento' | 'Completo' | 'Hiato' | 'Cancelado' | 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  chapters: number;
  rating: number;
  views: number;
  description: string;
  synopsis?: string | null;
  author: string;
  isHighlight?: boolean;
  is_home_highlight?: boolean;
  isWeeklyHighlight?: boolean;
  is_weekly_highlight?: boolean;
  is_featured?: boolean;
  updatedAt: string;
  updated_at?: string | null;
  slug?: string;
  banner_url?: string | null;
  genres?: string[] | null;
}

export interface DbManga {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  banner_url: string | null;
  type: 'manga' | 'manhwa' | 'manhua' | 'novel' | 'webtoon';
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  synopsis: string | null;
  author: string | null;
  artist: string | null;
  rating: number | null;
  views: number | null;
  is_featured: boolean | null;
  is_home_highlight: boolean | null;
  is_weekly_highlight: boolean | null;
  genres: string[] | null;
  year_published: number | null;
  original_language: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Helper to convert DB manga to UI manga
export const dbToUiManga = (db: DbManga, chapterCount: number = 0): Manga => {
  const typeMap: Record<string, Manga['type']> = {
    manga: 'Mangá',
    manhwa: 'Manhwa',
    manhua: 'Manhua',
    novel: 'Mangá',
    webtoon: 'Manhwa',
  };

  const statusMap: Record<string, Manga['status']> = {
    ongoing: 'Em Andamento',
    completed: 'Completo',
    hiatus: 'Hiato',
    cancelled: 'Cancelado',
  };

  return {
    id: db.id,
    title: db.title,
    cover: db.cover_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop',
    cover_url: db.cover_url,
    type: typeMap[db.type] || 'Mangá',
    status: statusMap[db.status] || 'Em Andamento',
    chapters: chapterCount,
    rating: db.rating || 0,
    views: db.views || 0,
    description: db.synopsis || '',
    synopsis: db.synopsis,
    author: db.author || 'Desconhecido',
    isHighlight: db.is_home_highlight || false,
    is_home_highlight: db.is_home_highlight,
    isWeeklyHighlight: db.is_weekly_highlight || false,
    is_weekly_highlight: db.is_weekly_highlight,
    is_featured: db.is_featured,
    updatedAt: db.updated_at ? new Date(db.updated_at).toLocaleDateString('pt-BR') : '',
    updated_at: db.updated_at,
    slug: db.slug,
    banner_url: db.banner_url,
    genres: db.genres,
  };
};

export type MangaType = 'Todos' | 'Mangá' | 'Manhwa' | 'Manhua';
export type MangaStatus = 'Todos' | 'Em Andamento' | 'Completo' | 'Hiato' | 'Cancelado';
