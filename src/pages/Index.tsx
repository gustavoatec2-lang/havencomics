import { useState, useEffect } from 'react';
import { Clock, Flame, Star, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import SectionHeader from '@/components/SectionHeader';
import MangaCard from '@/components/MangaCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Manga, DbManga, dbToUiManga } from '@/types/manga';
import { triggerPopunder } from '@/utils/popunder';

const Index = () => {
  const [featuredManga, setFeaturedManga] = useState<Manga | null>(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Manga[]>([]);
  const [highlights, setHighlights] = useState<Manga[]>([]);
  const [top10, setTop10] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMangas();
  }, []);

  const fetchMangas = async () => {
    try {
      // Fetch all mangas with chapter counts
      const { data: mangas } = await supabase
        .from('mangas')
        .select('*')
        .order('updated_at', { ascending: false });

      if (mangas && mangas.length > 0) {
        // Get chapter counts for each manga
        const mangasWithChapters = await Promise.all(
          mangas.map(async (manga) => {
            const { count } = await supabase
              .from('chapters')
              .select('*', { count: 'exact', head: true })
              .eq('manga_id', manga.id);
            return dbToUiManga(manga as DbManga, count || 0);
          })
        );

        // Featured manga (weekly highlight with banner)
        const featured = mangasWithChapters.find(m => m.is_weekly_highlight || m.isWeeklyHighlight);
        setFeaturedManga(featured || mangasWithChapters[0] || null);

        // Recently updated (sorted by updated_at)
        setRecentlyUpdated(mangasWithChapters.slice(0, 6));

        // Highlights
        const highlightMangas = mangasWithChapters.filter(m => m.isHighlight || m.is_home_highlight);
        setHighlights(highlightMangas.length > 0 ? highlightMangas : mangasWithChapters.slice(0, 3));

        // Top 10 by views
        const sortedByViews = [...mangasWithChapters].sort((a, b) => b.views - a.views);
        setTop10(sortedByViews.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching mangas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      {featuredManga && <HeroSection manga={featuredManga} />}

      {/* Main Content */}
      <main className="container py-12 space-y-16">
        {/* Recently Updated */}
        {recentlyUpdated.length > 0 && (
          <section>
            <SectionHeader
              icon={Clock}
              title="Recentemente Atualizados"
              subtitle="As obras mais atualizadas"
              viewAllLink="/catalogo"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyUpdated.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          </section>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <section>
            <SectionHeader
              icon={Star}
              title="Mangás em Destaque"
              subtitle="Seleção especial do nosso time"
              viewAllLink="/catalogo?highlight=true"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {highlights.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          </section>
        )}

        {/* Weekly Highlight */}
        {featuredManga && (
          <section className="relative rounded-2xl overflow-hidden bg-card">
            <div className="absolute inset-0">
              <img
                src={featuredManga.banner_url || featuredManga.cover}
                alt=""
                className="w-full h-full object-cover opacity-20 blur-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            </div>
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                  <Flame className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Destaque da Semana</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                  {featuredManga.title}
                </h2>
                <p className="text-muted-foreground mb-6 line-clamp-3 max-w-xl">
                  {featuredManga.description}
                </p>
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <Link to={`/manga/${featuredManga.id}`} onClick={triggerPopunder}>
                    <Button variant="default">Ver Detalhes</Button>
                  </Link>
                </div>
              </div>
              <div className="w-48 md:w-56 flex-shrink-0">
                <img
                  src={featuredManga.cover}
                  alt={featuredManga.title}
                  className="w-full rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </section>
        )}

        {/* Top 10 */}
        {top10.length > 0 && (
          <section>
            <SectionHeader
              icon={Flame}
              title="Top 10 Mais Populares"
              subtitle="As obras com mais visualizações"
              viewAllLink="/catalogo?sort=popular"
              viewAllText="Ver mais"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {top10.map((manga, index) => (
                <MangaCard
                  key={manga.id}
                  manga={manga}
                  variant="horizontal"
                  showRank={index + 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="text-center py-12 space-y-6">
          <div className="flex items-center gap-2 justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Explorar Mais
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            Descubra milhares de obras
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Navegue por nosso catálogo completo com filtros por gênero, tipo e status.
            Encontre exatamente o que procura.
          </p>
          <Link to="/catalogo">
            <Button variant="outline" size="lg" className="gap-2">
              Ver Catálogo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
