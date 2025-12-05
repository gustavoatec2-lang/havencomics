import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MangaCard from '@/components/MangaCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Manga, DbManga, dbToUiManga, MangaType, MangaStatus } from '@/types/manga';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const Catalogo = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<MangaType>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<MangaStatus>('Todos');
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  const types: MangaType[] = ['Todos', 'Mangá', 'Manhwa', 'Manhua'];
  const statuses: MangaStatus[] = ['Todos', 'Em Andamento', 'Completo', 'Hiato', 'Cancelado'];

  useEffect(() => {
    fetchMangas();
  }, []);

  const fetchMangas = async () => {
    try {
      const { data } = await supabase
        .from('mangas')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data) {
        const mangasWithChapters = await Promise.all(
          data.map(async (manga) => {
            const { count } = await supabase
              .from('chapters')
              .select('*', { count: 'exact', head: true })
              .eq('manga_id', manga.id);
            return dbToUiManga(manga as DbManga, count || 0);
          })
        );
        setMangas(mangasWithChapters);
      }
    } catch (error) {
      console.error('Error fetching mangas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMangas = useMemo(() => {
    return mangas.filter((manga) => {
      const matchesSearch = manga.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'Todos' || manga.type === selectedType;
      const matchesStatus = selectedStatus === 'Todos' || manga.status === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [mangas, searchTerm, selectedType, selectedStatus]);

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
          </aside>

          {/* Results */}
          <div className="flex-1">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {filteredMangas.length} obras encontradas
                </p>
                
                {filteredMangas.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredMangas.map((manga) => (
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
