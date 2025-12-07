import { useState, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Calendar, ArrowUpDown } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MangaCard from '@/components/MangaCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Manga, DbManga, dbToUiManga, MangaType, MangaStatus } from '@/types/manga';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type SortOption = 'recent' | 'oldest' | 'popular' | 'unpopular';

interface CatalogoData {
  mangas: Manga[];
  genres: string[];
}

const fetchCatalogoData = async (): Promise<CatalogoData> => {
  const { data } = await supabase
    .from('mangas')
    .select('*')
    .order('updated_at', { ascending: false });

  if (!data) return { mangas: [], genres: [] };

  // Extract all unique genres from mangas
  const genresSet = new Set<string>();
  data.forEach((manga) => {
    if (manga.genres && Array.isArray(manga.genres)) {
      manga.genres.forEach((g: string) => genresSet.add(g));
    }
  });

  const mangasWithChapters = await Promise.all(
    data.map(async (manga) => {
      const { count } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('manga_id', manga.id);
      return dbToUiManga(manga as DbManga, count || 0);
    })
  );

  return {
    mangas: mangasWithChapters,
    genres: Array.from(genresSet).sort(),
  };
};

const Catalogo = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<MangaType>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<MangaStatus>('Todos');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const { data: catalogoData, isLoading } = useQuery({
    queryKey: ['mangas', 'catalogo'],
    queryFn: fetchCatalogoData,
  });

  const mangas = catalogoData?.mangas ?? [];
  const allGenres = catalogoData?.genres ?? [];

  const types: MangaType[] = ['Todos', 'Mangá', 'Manhwa', 'Manhua'];
  const statuses: MangaStatus[] = ['Todos', 'Em Andamento', 'Completo', 'Hiato', 'Cancelado'];

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'recent', label: 'Mais Novo', icon: <Calendar className="h-4 w-4" /> },
    { value: 'oldest', label: 'Mais Antigo', icon: <Calendar className="h-4 w-4" /> },
    { value: 'popular', label: 'Mais Popular', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'unpopular', label: 'Menos Popular', icon: <TrendingDown className="h-4 w-4" /> },
  ];

  const filteredAndSortedMangas = useMemo(() => {
    let result = mangas.filter((manga) => {
      const matchesSearch = manga.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'Todos' || manga.type === selectedType;
      const matchesStatus = selectedStatus === 'Todos' || manga.status === selectedStatus;
      const matchesGenre = selectedGenre === 'Todos' ||
        (manga.genres && manga.genres.includes(selectedGenre));
      return matchesSearch && matchesType && matchesStatus && matchesGenre;
    });

    // Sort the results
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime());
        break;
      case 'popular':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'unpopular':
        result.sort((a, b) => (a.views || 0) - (b.views || 0));
        break;
    }

    return result;
  }, [mangas, searchTerm, selectedType, selectedStatus, selectedGenre, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Catálogo Completo
          </h1>
          <p className="text-muted-foreground">
            Explore nossa coleção de mangás, manhwas e manhuas
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0 space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Buscar</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-1">
                <ArrowUpDown className="h-4 w-4" /> Ordenar por
              </h3>
              <div className="space-y-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                      sortBy === option.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Tipo</h3>
              <div className="space-y-1">
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedType === type
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Status</h3>
              <div className="space-y-1">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedStatus === status
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre Filter */}
            {allGenres.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Gêneros</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setSelectedGenre('Todos')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedGenre === 'Todos'
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Todos
                  </button>
                  {allGenres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedGenre === genre
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Results */}
          <div className="flex-1">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {filteredAndSortedMangas.length} obras encontradas
                </p>

                {filteredAndSortedMangas.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredAndSortedMangas.map((manga) => (
                      <MangaCard key={manga.id} manga={manga} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Nenhuma obra encontrada</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedType('Todos');
                        setSelectedStatus('Todos');
                        setSelectedGenre('Todos');
                        setSortBy('recent');
                      }}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Catalogo;
