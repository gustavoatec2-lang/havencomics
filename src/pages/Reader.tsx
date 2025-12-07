import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Comments from '@/components/Comments';
import BannerAd from '@/components/BannerAd';
import ChapterAds from '@/components/ChapterAds';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChapterData {
  id: string;
  number: number;
  title: string | null;
  pages: string[] | null;
}

interface MangaData {
  id: string;
  title: string;
  slug: string;
}

const Reader = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [manga, setManga] = useState<MangaData | null>(null);
  const [currentChapterData, setCurrentChapterData] = useState<ChapterData | null>(null);
  const [chapters, setChapters] = useState<{ number: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const currentChapter = parseFloat(chapter || '1');
  const [showControls, setShowControls] = useState(true);
  const readingStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (id) {
      fetchMangaAndChapter();
    }
  }, [id, chapter]);

  // Save reading history when user reads
  useEffect(() => {
    if (user && manga && currentChapterData) {
      saveReadingHistory();
    }
  }, [user, manga?.id, currentChapterData?.id]);

  // Track reading time
  useEffect(() => {
    readingStartTime.current = Date.now();

    return () => {
      if (user && manga) {
        const timeSpent = Math.floor((Date.now() - readingStartTime.current) / 1000);
        updateReadingTime(timeSpent);
      }
    };
  }, [user, manga?.id, currentChapter]);

  // Increment manga views once per session
  useEffect(() => {
    if (manga?.id) {
      incrementMangaViews(manga.id);
    }
  }, [manga?.id]);

  const incrementMangaViews = async (mangaId: string) => {
    // Use sessionStorage to track if we already counted this manga in this session
    const viewedKey = `viewed_${mangaId}`;
    if (sessionStorage.getItem(viewedKey)) return;

    try {
      // Increment views using RPC or direct update
      const { data: currentManga } = await supabase
        .from('mangas')
        .select('views')
        .eq('id', mangaId)
        .single();

      if (currentManga) {
        await supabase
          .from('mangas')
          .update({ views: (currentManga.views || 0) + 1 })
          .eq('id', mangaId);

        sessionStorage.setItem(viewedKey, 'true');
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const saveReadingHistory = async () => {
    if (!user || !manga || !currentChapterData) return;

    try {
      // Check if history exists
      const { data: existing } = await supabase
        .from('reading_history')
        .select('id, reading_time_seconds')
        .eq('user_id', user.id)
        .eq('manga_id', manga.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from('reading_history')
          .update({
            chapter_id: currentChapterData.id,
            last_chapter_number: currentChapter,
            last_read_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new
        await supabase
          .from('reading_history')
          .insert({
            user_id: user.id,
            manga_id: manga.id,
            chapter_id: currentChapterData.id,
            last_chapter_number: currentChapter,
            reading_time_seconds: 0
          });
      }
    } catch (error) {
      console.error('Error saving reading history:', error);
    }
  };

  const updateReadingTime = async (seconds: number) => {
    if (!user || !manga || seconds < 5) return; // Only save if read more than 5 seconds

    try {
      // Update reading_history
      const { data: existing } = await supabase
        .from('reading_history')
        .select('id, reading_time_seconds')
        .eq('user_id', user.id)
        .eq('manga_id', manga.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('reading_history')
          .update({
            reading_time_seconds: (existing.reading_time_seconds || 0) + seconds
          })
          .eq('id', existing.id);
      }

      // Also update profile total_reading_time
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_reading_time')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_reading_time: (profile.total_reading_time || 0) + seconds
          })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating reading time:', error);
    }
  };

  const fetchMangaAndChapter = async () => {
    setLoading(true);
    try {
      // Try fetching manga by UUID first
      let { data: mangaData } = await supabase
        .from('mangas')
        .select('id, title, slug')
        .eq('id', id)
        .maybeSingle();

      // If not found by UUID, try by slug
      if (!mangaData) {
        const { data: slugData } = await supabase
          .from('mangas')
          .select('id, title, slug')
          .eq('slug', id)
          .maybeSingle();
        mangaData = slugData;
      }

      if (!mangaData) {
        setLoading(false);
        return;
      }

      setManga(mangaData);

      // Fetch all chapter numbers for navigation
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('number')
        .eq('manga_id', mangaData.id)
        .order('number', { ascending: true });

      if (chaptersData) {
        setChapters(chaptersData);
      }

      // Fetch current chapter
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('id, number, title, pages')
        .eq('manga_id', mangaData.id)
        .eq('number', currentChapter)
        .maybeSingle();

      if (chapterData) {
        setCurrentChapterData(chapterData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Obra não encontrada</h1>
          <Link to="/catalogo">
            <Button variant="outline">Voltar ao catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!currentChapterData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Capítulo não encontrado</h1>
          <Link to={`/manga/${manga.id}`}>
            <Button variant="outline">Ver capítulos disponíveis</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pages = currentChapterData.pages || [];
  const chapterIndex = chapters.findIndex(c => c.number === currentChapter);
  const prevChapter = chapterIndex > 0 ? chapters[chapterIndex - 1]?.number : null;
  const nextChapter = chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1]?.number : null;

  const goToPrevChapter = () => {
    if (prevChapter !== null) {
      navigate(`/manga/${manga.id}/ler/${prevChapter}`);
    }
  };

  const goToNextChapter = () => {
    if (nextChapter !== null) {
      navigate(`/manga/${manga.id}/ler/${nextChapter}`);
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      onClick={() => setShowControls(!showControls)}
    >
      {/* Top Bar */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border transition-transform duration-300",
          !showControls && "-translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Link to={`/manga/${manga.id}`}>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </Link>
            <div className="hidden sm:block">
              <h1 className="font-medium text-sm truncate max-w-[200px] md:max-w-none">
                {manga.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                Capítulo {currentChapter}{currentChapterData.title ? `: ${currentChapterData.title}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <Link to={`/manga/${manga.id}`}>
              <Button variant="ghost" size="icon">
                <List className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Pages */}
      <main className="pt-14 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Top Banner Ad */}
          <BannerAd />
          {/* In-Chapter Ads */}
          <ChapterAds />
          {pages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma página disponível para este capítulo.
            </div>
          ) : (
            pages.map((page, index) => (
              <div key={index} className="relative">
                <img
                  src={page}
                  alt={`Página ${index + 1}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
                <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs text-muted-foreground">
                  {index + 1}/{pages.length}
                </div>
              </div>
            ))
          )}

          {/* End of chapter with Banner Ad */}
          <div className="p-8 text-center space-y-4 bg-card rounded-lg m-4">
            {/* Bottom Banner Ad - Above Fim do Capítulo */}
            <BannerAd />
            <p className="text-muted-foreground">Fim do Capítulo {currentChapter}</p>
            <div className="flex items-center justify-center gap-4">
              {prevChapter !== null && (
                <Button variant="outline" onClick={goToPrevChapter}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}
              {nextChapter !== null && (
                <Button onClick={goToNextChapter}>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <Link to={`/manga/${manga.id}`} className="block">
              <Button variant="ghost" size="sm">
                Ver todos os capítulos
              </Button>
            </Link>
          </div>

          {/* Comments Section */}
          <div className="m-4" onClick={(e) => e.stopPropagation()}>
            <Comments mangaId={manga.id} chapterNumber={currentChapter} />
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <footer
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border transition-transform duration-300",
          !showControls && "translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container flex items-center justify-between h-16">
          <Button
            variant="ghost"
            onClick={goToPrevChapter}
            disabled={prevChapter === null}
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Cap. {currentChapter} / {chapters.length}
            </span>
          </div>

          <Button
            variant="ghost"
            onClick={goToNextChapter}
            disabled={nextChapter === null}
          >
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Reader;
