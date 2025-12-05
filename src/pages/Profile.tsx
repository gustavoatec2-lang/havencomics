import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Clock, BookOpen, Heart, Crown, Calendar, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  username: string | null;
  vip_tier: string;
  vip_expires_at: string | null;
  total_reading_time: number;
}

interface ReadingHistoryItem {
  manga_id: string;
  last_chapter_number: number;
  reading_time_seconds: number;
  last_read_at: string;
  mangas: {
    title: string;
    cover_url: string;
    type: string;
  };
}

interface FavoriteItem {
  manga_id: string;
  created_at: string;
  mangas: {
    title: string;
    cover_url: string;
    type: string;
  };
}

interface UserRole {
  role: 'admin' | 'moderator' | 'user' | 'dono';
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/entrar');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserRoles();
      fetchReadingHistory();
      fetchFavorites();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username, vip_tier, vip_expires_at, total_reading_time')
      .eq('id', user!.id)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchUserRoles = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user!.id);
    
    if (data) setUserRoles(data.map((r: UserRole) => r.role));
  };

  const fetchReadingHistory = async () => {
    const { data } = await supabase
      .from('reading_history')
      .select('manga_id, last_chapter_number, reading_time_seconds, last_read_at, mangas(title, cover_url, type)')
      .eq('user_id', user!.id)
      .order('last_read_at', { ascending: false })
      .limit(20);
    
    if (data) setReadingHistory(data as any);
  };

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('manga_id, created_at, mangas(title, cover_url, type)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (data) setFavorites(data as any);
  };

  const formatReadingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'gold':
        return <Badge variant="warning" className="gap-1"><Crown className="h-3 w-3" /> Gold</Badge>;
      case 'silver':
        return <Badge variant="secondary" className="gap-1"><Crown className="h-3 w-3" /> Silver</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'dono':
        return <Badge key={role} className="gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0"><Crown className="h-3 w-3" /> Dono</Badge>;
      case 'admin':
        return <Badge key={role} variant="destructive" className="gap-1">Admin</Badge>;
      case 'moderator':
        return <Badge key={role} variant="secondary" className="gap-1">Moderador</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Profile Header */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold mb-1">
                {profile?.username || 'Usuário'}
              </h1>
              <div className="flex items-center gap-2 justify-center md:justify-start text-muted-foreground mb-3">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                {userRoles.filter(r => r !== 'user').map(role => getRoleBadge(role))}
                {profile && getTierBadge(profile.vip_tier)}
                {profile?.vip_expires_at && profile.vip_tier !== 'free' && (
                  <span className="text-xs text-muted-foreground">
                    Expira em {new Date(profile.vip_expires_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{formatReadingTime(profile?.total_reading_time || 0)}</p>
            <p className="text-xs text-muted-foreground">Tempo de Leitura</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{readingHistory.length}</p>
            <p className="text-xs text-muted-foreground">Obras Lidas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Heart className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{favorites.length}</p>
            <p className="text-xs text-muted-foreground">Favoritos</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">
              {!profile?.vip_tier || profile.vip_tier === 'free' 
                ? 'Free' 
                : profile.vip_tier.charAt(0).toUpperCase() + profile.vip_tier.slice(1)}
            </p>
            <p className="text-xs text-muted-foreground">Plano Atual</p>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Minha Assinatura
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{profile?.vip_tier || 'Free'}</p>
              {profile?.vip_tier !== 'free' && profile?.vip_expires_at ? (
                <p className="text-sm text-muted-foreground">
                  Válido até {new Date(profile.vip_expires_at).toLocaleDateString('pt-BR')}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem assinatura ativa</p>
              )}
            </div>
            <Button variant="outline" onClick={() => navigate('/vip')}>
              {profile?.vip_tier === 'free' ? 'Assinar VIP' : 'Gerenciar'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Histórico de Leitura
          </Button>
          <Button
            variant={activeTab === 'favorites' ? 'default' : 'outline'}
            onClick={() => setActiveTab('favorites')}
            className="gap-2"
          >
            <Heart className="h-4 w-4" />
            Favoritos
          </Button>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {activeTab === 'history' ? (
            readingHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não leu nenhuma obra</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {readingHistory.map((item) => (
                  <div key={item.manga_id} className="flex items-center gap-4 p-4">
                    <div className="w-12 h-16 rounded overflow-hidden bg-secondary flex-shrink-0">
                      {item.mangas?.cover_url && (
                        <img src={item.mangas.cover_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.mangas?.title || 'Obra desconhecida'}</p>
                      <p className="text-sm text-muted-foreground">
                        Último capítulo: {item.last_chapter_number} • {formatReadingTime(item.reading_time_seconds)}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.last_read_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            favorites.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não tem favoritos</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {favorites.map((item) => (
                  <Link 
                    key={item.manga_id} 
                    to={`/manga/${item.manga_id}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary transition-colors"
                  >
                    <div className="w-12 h-16 rounded overflow-hidden bg-secondary flex-shrink-0">
                      {item.mangas?.cover_url && (
                        <img src={item.mangas.cover_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.mangas?.title || 'Obra desconhecida'}</p>
                      <Badge variant="secondary" className="text-xs">{item.mangas?.type}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
