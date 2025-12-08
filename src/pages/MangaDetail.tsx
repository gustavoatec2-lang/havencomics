import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Star, Eye, Clock, ChevronRight, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Comments from '@/components/Comments';
import SEOHead, { generateMangaSchema } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Manga, DbManga, dbToUiManga } from '@/types/manga';
import { cn } from '@/lib/utils';
import { triggerPopunder } from '@/utils/popunder';
import { useQuery } from '@tanstack/react-query';

interface Chapter {
  id: string;
  number: number;
  title: string | null;
  created_at: string | null;
}

interface ReadingHistory {
  last_chapter_number: number | null;
  chapter_id: string | null;
}

interface MangaData {
  manga: Manga;
  chapters: Chapter[];
}

const fetchMangaData = async (id: string): Promise<MangaData | null> => {
  // Try fetching by UUID first
  let { data } = await supabase
    .from('mangas')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // If not found by UUID, try by slug
  if (!data) {
    const { data: slugData } = await supabase
      .from('mangas')
      .select('*')
      .eq('slug', id)
      .maybeSingle();
    data = slugData;
  }

  if (!data) return null;

  const { count } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })
    .eq('manga_id', data.id);

  const manga = dbToUiManga(data as DbManga, count || 0);

  // Fetch chapters
  const { data: chaptersData } = await supabase
    .from('chapters')
    .select('id, number, title, created_at')
    .eq('manga_id', data.id)
    .order('number', { ascending: false });

  return {
    manga,
    chapters: chaptersData || [],
  };
};

const MangaDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory | null>(null);
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());

  const { data: mangaData, isLoading } = useQuery({
    queryKey: ['manga', id],
    queryFn: () => fetchMangaData(id!),
    enabled: !!id,
  });

  const manga = mangaData?.manga ?? null;
  const chapters = mangaData?.chapters ?? [];

  useEffect(() => {
    if (user && manga) {
      checkFavorite();
      fetchReadingHistory();
    }
  }, [user, manga?.id]);

  const fetchReadingHistory = async () => {
    if (!user || !manga) return;

    try {
      // Get reading history for this manga
      const { data } = await supabase
        .from('reading_history')
        .select('last_chapter_number, chapter_id')
        .eq('user_id', user.id)
        .eq('manga_id', manga.id)
        .maybeSingle();

      if (data) {
        setReadingHistory(data);

        // Mark all chapters up to last read as "read"
        if (data.last_chapter_number) {
          const readSet = new Set<number>();
          chapters.forEach(ch => {
            if (ch.number <= data.last_chapter_number!) {
              readSet.add(ch.number);
            }
          });
          setReadChapters(readSet);
        }
      }
    } catch (error) {
      console.error('Error fetching reading history:', error);
    }
  };

  // Update read chapters when chapters list changes
  useEffect(() => {
    if (readingHistory?.last_chapter_number && chapters.length > 0) {
      const readSet = new Set<number>();
      chapters.forEach(ch => {
        if (ch.number <= readingHistory.last_chapter_number!) {
          readSet.add(ch.number);
        }
      });
      setReadChapters(readSet);
    }
  }, [chapters, readingHistory]);

  const checkFavorite = async () => {
    if (!manga) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user!.id)
      .eq('manga_id', manga.id)
      .maybeSingle();
    setIsFavorited(!!data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Obra não encontrada</h1>
          <Link to="/catalogo">
            <Button variant="outline">Voltar ao catálogo</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'info'> = {
    'Em Andamento': 'success',
    'Completo': 'info',
    'Hiato': 'warning',
    'Cancelado': 'destructive',
  };

  const handleFavorite = async () => {
    if (!user) {
      toast({ title: 'Faça login', description: 'Você precisa estar logado para favoritar', variant: 'destructive' });
      return;
    }

    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('manga_id', id!);
        setIsFavorited(false);
        toast({ title: 'Removido dos favoritos', description: `${manga.title} foi removido.` });
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: user.id, manga_id: id! });
        if (error) throw error;
        setIsFavorited(true);
        toast({ title: 'Adicionado aos favoritos!', description: `${manga.title} foi adicionado.` });
      }
    } catch (error: any) {
      console.error('Favorite error:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar favoritos', variant: 'destructive' });
    }
  };

  const firstChapter = chapters.length > 0 ? Math.min(...chapters.map(c => c.number)) : 1;
  const continueChapter = readingHistory?.last_chapter_number || firstChapter;
  const hasReadingHistory = !!readingHistory?.last_chapter_number;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${manga.title} - Ler Online Grátis | HavenComics`}
        description={`Leia ${manga.title} online grátis em português. ${manga.description?.slice(0, 120)}...`}
        keywords={`ler ${manga.title} online, ${manga.title} mangá, ${manga.type} online, ${manga.author}`}
        ogImage={manga.cover}
        ogType="book"
        canonicalPath={`/manga/${manga.id}`}
        structuredData={generateMangaSchema({
          title: manga.title,
          description: manga.description || '',
          author: manga.author,
          cover: manga.cover,
          genres: manga.genres,
          rating: manga.rating,
          id: manga.id,
        })}
      />
      <Header />

      <main>
        {/* Hero Banner */}
        <section className="relative">
          <div className="absolute inset-0 h-80 overflow-hidden">
            <img
              src={manga.banner_url || manga.cover}
              alt=""
              className="w-full h-full object-cover opacity-30 blur-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>

          <div className="container relative pt-8 pb-12">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={manga.cover}
                  alt={manga.title}
                  className="w-48 md:w-64 rounded-xl shadow-2xl"
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Badge variant="secondary">{manga.type}</Badge>
                  <Badge variant={statusColors[manga.status] || 'secondary'}>{manga.status}</Badge>
                </div>

                <h1 className="text-2xl md:text-4xl font-display font-bold mb-4">
                  {manga.title}
                </h1>

                <p className="text-muted-foreground mb-6 max-w-2xl">
                  {manga.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-6 justify-center md:justify-start mb-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="font-medium">{manga.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{manga.views >= 1000000 ? `${(manga.views / 1000000).toFixed(1)}M` : `${(manga.views / 1000).toFixed(0)}K`}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Atualizado: {manga.updatedAt}</span>
                  </div>
                </div>

                {/* Author */}
                <p className="text-sm text-muted-foreground mb-6">
                  Por <span className="text-foreground font-medium">{manga.author}</span>
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <Link to={`/manga/${manga.id}/ler/${continueChapter}`} onClick={triggerPopunder}>
                    <Button variant="default" size="lg" className="gap-2">
                      <Play className="h-4 w-4" fill="currentColor" />
                      {hasReadingHistory ? `Continuar do Cap. ${continueChapter}` : 'Começar a Ler'}
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" onClick={handleFavorite}>
                    <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current text-destructive' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section className="container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold">
              Capítulos ({chapters.length})
            </h2>
          </div>

          {chapters.length > 0 ? (
            <div className="space-y-2">
              {chapters.map((chapter) => {
                const isRead = readChapters.has(chapter.number);
                return (
                  <Link
                    key={chapter.id}
                    to={`/manga/${manga.id}/ler/${chapter.number}`}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg transition-colors group",
                      isRead
                        ? "bg-muted/50 opacity-60"
                        : "bg-card hover:bg-secondary"
                    )}
                    onClick={triggerPopunder}
                  >
                    <div>
                      <h3 className={cn(
                        "font-medium transition-colors",
                        isRead ? "text-muted-foreground" : "group-hover:text-primary"
                      )}>
                        Capítulo {chapter.number}{chapter.title ? `: ${chapter.title}` : ''}
                        {isRead && <span className="ml-2 text-xs text-muted-foreground">(Lido)</span>}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {chapter.created_at ? new Date(chapter.created_at).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                    <ChevronRight className={cn(
                      "h-5 w-5 transition-colors",
                      isRead ? "text-muted-foreground/50" : "text-muted-foreground group-hover:text-primary"
                    )} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum capítulo disponível ainda.
            </div>
          )}
        </section>

        {/* Comments Section */}
        <section className="container pb-12">
          <Comments mangaId={manga.id} />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MangaDetail;
