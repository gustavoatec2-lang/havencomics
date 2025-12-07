import { useState, useEffect, useCallback } from 'react';
import { BarChart2, BookOpen, Users, MessageCircle, Heart, Ticket, TrendingUp, Eye, Clock, RefreshCw, Library, FileText, Crown, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

type StatsCategory = 'overview' | 'mangas' | 'chapters' | 'users' | 'interactions' | 'vip';

interface DetailedStats {
    // Overview
    totalMangas: number;
    totalChapters: number;
    totalPages: number;
    totalUsers: number;
    totalComments: number;
    totalFavorites: number;
    totalViews: number;
    totalReadingHistory: number;

    // Mangas breakdown
    mangasByType: { type: string; count: number }[];
    mangasByStatus: { status: string; count: number }[];
    topMangasByViews: { id: string; title: string; views: number }[];
    recentMangas: { id: string; title: string; created_at: string }[];

    // Chapters
    totalChaptersCount: number;
    avgPagesPerChapter: number;
    topMangasByChapters: { title: string; count: number }[];
    recentChapters: { manga_title: string; number: number; created_at: string }[];

    // Users
    totalProfiles: number;
    vipUsers: number;
    activeVipUsers: number;
    totalReadingTime: number;

    // Interactions
    recentComments: { content: string; created_at: string }[];
    topFavorited: { title: string; count: number }[];
    uniqueReaders: number;

    // VIP
    totalCodes: number;
    usedCodes: number;
    unusedCodes: number;
    codesByTier: { tier: string; total: number; used: number }[];
}

const initialStats: DetailedStats = {
    totalMangas: 0,
    totalChapters: 0,
    totalPages: 0,
    totalUsers: 0,
    totalComments: 0,
    totalFavorites: 0,
    totalViews: 0,
    totalReadingHistory: 0,
    mangasByType: [],
    mangasByStatus: [],
    topMangasByViews: [],
    recentMangas: [],
    totalChaptersCount: 0,
    avgPagesPerChapter: 0,
    topMangasByChapters: [],
    recentChapters: [],
    totalProfiles: 0,
    vipUsers: 0,
    activeVipUsers: 0,
    totalReadingTime: 0,
    recentComments: [],
    topFavorited: [],
    uniqueReaders: 0,
    totalCodes: 0,
    usedCodes: 0,
    unusedCodes: 0,
    codesByTier: [],
};

const categoryConfig: { value: StatsCategory; label: string; icon: React.ElementType }[] = [
    { value: 'overview', label: 'Geral', icon: BarChart2 },
    { value: 'mangas', label: 'Mangás', icon: BookOpen },
    { value: 'chapters', label: 'Capítulos', icon: FileText },
    { value: 'users', label: 'Usuários', icon: Users },
    { value: 'interactions', label: 'Interações', icon: MessageCircle },
    { value: 'vip', label: 'VIP', icon: Crown },
];

const AdminStatistics = () => {
    const [category, setCategory] = useState<StatsCategory>('overview');
    const [stats, setStats] = useState<DetailedStats>(initialStats);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch basic counts
            const [
                { count: mangasCount },
                { count: chaptersCount },
                { count: profilesCount },
                { count: commentsCount },
                { count: favoritesCount },
                { count: readingHistoryCount },
                { count: vipCodesCount },
            ] = await Promise.all([
                supabase.from('mangas').select('*', { count: 'exact', head: true }),
                supabase.from('chapters').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('comments').select('*', { count: 'exact', head: true }),
                supabase.from('favorites').select('*', { count: 'exact', head: true }),
                supabase.from('reading_history').select('*', { count: 'exact', head: true }),
                supabase.from('vip_codes').select('*', { count: 'exact', head: true }),
            ]);

            // Fetch mangas data
            const { data: mangasData } = await supabase
                .from('mangas')
                .select('id, title, type, status, views, created_at')
                .order('views', { ascending: false });

            // Fetch chapters with pages for total pages count
            const { data: chaptersData } = await supabase
                .from('chapters')
                .select('id, manga_id, number, pages, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            // Fetch VIP codes for breakdown
            const { data: vipCodesData } = await supabase.from('vip_codes').select('*');

            // Fetch VIP users
            const { data: vipUsersData } = await supabase
                .from('profiles')
                .select('vip_tier, vip_expires_at, total_reading_time')
                .not('vip_tier', 'is', null);

            // Fetch recent comments
            const { data: recentCommentsData } = await supabase
                .from('comments')
                .select('content, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            // Fetch favorites count per manga
            const { data: favoritesPerManga } = await supabase
                .from('favorites')
                .select('manga_id');

            // Get unique readers count
            const { data: uniqueReadersData } = await supabase
                .from('reading_history')
                .select('user_id');

            // Calculate mangás by type
            const typeCount: Record<string, number> = {};
            const statusCount: Record<string, number> = {};
            let totalViews = 0;

            mangasData?.forEach((m) => {
                typeCount[m.type] = (typeCount[m.type] || 0) + 1;
                statusCount[m.status] = (statusCount[m.status] || 0) + 1;
                totalViews += m.views || 0;
            });

            const mangasByType = Object.entries(typeCount).map(([type, count]) => ({ type, count }));
            const mangasByStatus = Object.entries(statusCount).map(([status, count]) => ({ status, count }));

            // Top mangas by views
            const topMangasByViews = (mangasData || []).slice(0, 10).map((m) => ({
                id: m.id,
                title: m.title,
                views: m.views || 0,
            }));

            // Recent mangas
            const recentMangas = (mangasData || [])
                .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                .slice(0, 5)
                .map((m) => ({ id: m.id, title: m.title, created_at: m.created_at || '' }));

            // Calculate pages and avg pages per chapter
            let totalPages = 0;
            chaptersData?.forEach((ch) => {
                totalPages += (ch.pages || []).length;
            });
            const avgPagesPerChapter = chaptersCount ? Math.round(totalPages / (chaptersData?.length || 1)) : 0;

            // Top mangas by chapters count
            const chapterCountByManga: Record<string, { title: string; count: number }> = {};
            chaptersData?.forEach((ch) => {
                const manga = mangasData?.find((m) => m.id === ch.manga_id);
                const key = ch.manga_id;
                if (!chapterCountByManga[key]) {
                    chapterCountByManga[key] = { title: manga?.title || 'Desconhecido', count: 0 };
                }
                chapterCountByManga[key].count += 1;
            });
            const topMangasByChapters = Object.values(chapterCountByManga)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Recent chapters
            const recentChapters = (chaptersData || []).slice(0, 5).map((ch) => {
                const manga = mangasData?.find((m) => m.id === ch.manga_id);
                return {
                    manga_title: manga?.title || 'Desconhecido',
                    number: ch.number,
                    created_at: ch.created_at || '',
                };
            });

            // VIP stats
            const now = new Date();
            const activeVipUsers = (vipUsersData || []).filter((u) =>
                u.vip_expires_at && new Date(u.vip_expires_at) > now
            ).length;

            const totalReadingTime = (vipUsersData || []).reduce(
                (sum, u) => sum + (u.total_reading_time || 0),
                0
            );

            // VIP codes by tier
            const tierBreakdown: Record<string, { total: number; used: number }> = {};
            (vipCodesData || []).forEach((code) => {
                if (!tierBreakdown[code.tier]) {
                    tierBreakdown[code.tier] = { total: 0, used: 0 };
                }
                tierBreakdown[code.tier].total += 1;
                if (code.is_used) {
                    tierBreakdown[code.tier].used += 1;
                }
            });
            const codesByTier = Object.entries(tierBreakdown).map(([tier, data]) => ({
                tier,
                ...data,
            }));

            const usedCodes = (vipCodesData || []).filter((c) => c.is_used).length;

            // Top favorited mangas
            const favCountByManga: Record<string, number> = {};
            (favoritesPerManga || []).forEach((f) => {
                favCountByManga[f.manga_id] = (favCountByManga[f.manga_id] || 0) + 1;
            });
            const topFavorited = Object.entries(favCountByManga)
                .map(([id, count]) => ({
                    title: mangasData?.find((m) => m.id === id)?.title || 'Desconhecido',
                    count,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Unique readers
            const uniqueReaders = new Set((uniqueReadersData || []).map((r) => r.user_id)).size;

            setStats({
                totalMangas: mangasCount || 0,
                totalChapters: chaptersCount || 0,
                totalPages,
                totalUsers: profilesCount || 0,
                totalComments: commentsCount || 0,
                totalFavorites: favoritesCount || 0,
                totalViews,
                totalReadingHistory: readingHistoryCount || 0,
                mangasByType,
                mangasByStatus,
                topMangasByViews,
                recentMangas,
                totalChaptersCount: chaptersCount || 0,
                avgPagesPerChapter,
                topMangasByChapters,
                recentChapters,
                totalProfiles: profilesCount || 0,
                vipUsers: (vipUsersData || []).length,
                activeVipUsers,
                totalReadingTime,
                recentComments: (recentCommentsData || []).map((c) => ({
                    content: c.content.slice(0, 50) + (c.content.length > 50 ? '...' : ''),
                    created_at: c.created_at || '',
                })),
                topFavorited,
                uniqueReaders,
                totalCodes: vipCodesCount || 0,
                usedCodes,
                unusedCodes: (vipCodesCount || 0) - usedCodes,
                codesByTier,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={BookOpen} label="Mangás" value={stats.totalMangas} color="text-primary" />
                <StatCard icon={FileText} label="Capítulos" value={stats.totalChapters} color="text-info" />
                <StatCard icon={Layers} label="Páginas" value={formatNumber(stats.totalPages)} color="text-warning" />
                <StatCard icon={Eye} label="Views Totais" value={formatNumber(stats.totalViews)} color="text-success" />
                <StatCard icon={Users} label="Usuários" value={stats.totalUsers} color="text-secondary-foreground" />
                <StatCard icon={MessageCircle} label="Comentários" value={stats.totalComments} color="text-primary" />
                <StatCard icon={Heart} label="Favoritos" value={stats.totalFavorites} color="text-destructive" />
                <StatCard icon={Ticket} label="Códigos VIP" value={stats.totalCodes} color="text-warning" />
            </div>
        </div>
    );

    const renderMangas = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={BookOpen} label="Total Mangás" value={stats.totalMangas} color="text-primary" />
                <StatCard icon={Eye} label="Views Totais" value={formatNumber(stats.totalViews)} color="text-success" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-3">Por Tipo</h3>
                    <div className="space-y-2">
                        {stats.mangasByType.map((item) => (
                            <div key={item.type} className="flex justify-between items-center">
                                <span className="capitalize">{item.type}</span>
                                <Badge variant="secondary">{item.count}</Badge>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-3">Por Status</h3>
                    <div className="space-y-2">
                        {stats.mangasByStatus.map((item) => (
                            <div key={item.status} className="flex justify-between items-center">
                                <span className="capitalize">{item.status}</span>
                                <Badge variant="secondary">{item.count}</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" /> Top 10 por Views
                </h3>
                <div className="space-y-2">
                    {stats.topMangasByViews.map((item, i) => (
                        <div key={item.id} className="flex justify-between items-center">
                            <span>
                                <span className="text-muted-foreground mr-2">#{i + 1}</span>
                                {item.title}
                            </span>
                            <Badge variant="outline">{formatNumber(item.views)}</Badge>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderChapters = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={FileText} label="Total Capítulos" value={stats.totalChapters} color="text-info" />
                <StatCard icon={Layers} label="Total Páginas" value={formatNumber(stats.totalPages)} color="text-warning" />
                <StatCard icon={BarChart2} label="Média Págs/Cap" value={stats.avgPagesPerChapter} color="text-primary" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-3">Top Mangás por Capítulos</h3>
                    <div className="space-y-2">
                        {stats.topMangasByChapters.map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span>{item.title}</span>
                                <Badge variant="secondary">{item.count} caps</Badge>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-3">Capítulos Recentes</h3>
                    <div className="space-y-2">
                        {stats.recentChapters.map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span>
                                    {item.manga_title} - Cap {item.number}
                                </span>
                                <span className="text-sm text-muted-foreground">{formatDate(item.created_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Usuários" value={stats.totalProfiles} color="text-primary" />
                <StatCard icon={Crown} label="Usuários VIP" value={stats.vipUsers} color="text-warning" />
                <StatCard icon={Crown} label="VIPs Ativos" value={stats.activeVipUsers} color="text-success" />
                <StatCard icon={Clock} label="Tempo Leitura" value={formatTime(stats.totalReadingTime)} color="text-info" />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-3">Leitores Únicos</h3>
                <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">{stats.uniqueReaders}</div>
                    <div className="text-muted-foreground">usuários já leram pelo menos 1 capítulo</div>
                </div>
            </div>
        </div>
    );

    const renderInteractions = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={MessageCircle} label="Comentários" value={stats.totalComments} color="text-primary" />
                <StatCard icon={Heart} label="Favoritos" value={stats.totalFavorites} color="text-destructive" />
                <StatCard icon={Library} label="Em Leitura" value={stats.totalReadingHistory} color="text-info" />
                <StatCard icon={Users} label="Leitores Únicos" value={stats.uniqueReaders} color="text-success" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-destructive" /> Mais Favoritados
                    </h3>
                    <div className="space-y-2">
                        {stats.topFavorited.map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span>
                                    <span className="text-muted-foreground mr-2">#{i + 1}</span>
                                    {item.title}
                                </span>
                                <Badge variant="outline">{item.count}</Badge>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-3">Comentários Recentes</h3>
                    <div className="space-y-2">
                        {stats.recentComments.map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-sm">{item.content}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderVip = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Ticket} label="Total Códigos" value={stats.totalCodes} color="text-primary" />
                <StatCard icon={Ticket} label="Usados" value={stats.usedCodes} color="text-success" />
                <StatCard icon={Ticket} label="Disponíveis" value={stats.unusedCodes} color="text-warning" />
                <StatCard icon={Crown} label="VIPs Ativos" value={stats.activeVipUsers} color="text-info" />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-3">Códigos por Tier</h3>
                <div className="space-y-3">
                    {stats.codesByTier.map((item) => (
                        <div key={item.tier} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="secondary"
                                    className={
                                        item.tier === 'gold'
                                            ? 'bg-yellow-500/20 text-yellow-500'
                                            : item.tier === 'diamond'
                                                ? 'bg-cyan-500/20 text-cyan-500'
                                                : 'bg-gray-500/20 text-gray-400'
                                    }
                                >
                                    {item.tier}
                                </Badge>
                                <span>{item.total} códigos</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-success">{item.used} usados</span>
                                <span className="text-muted-foreground">|</span>
                                <span className="text-warning">{item.total - item.used} disponíveis</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (category) {
            case 'overview':
                return renderOverview();
            case 'mangas':
                return renderMangas();
            case 'chapters':
                return renderChapters();
            case 'users':
                return renderUsers();
            case 'interactions':
                return renderInteractions();
            case 'vip':
                return renderVip();
            default:
                return renderOverview();
        }
    };

    return (
        <div className="space-y-6">
            {/* Category buttons */}
            <div className="flex flex-wrap gap-2">
                {categoryConfig.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <Button
                            key={cat.value}
                            variant={category === cat.value ? 'default' : 'outline'}
                            className="gap-2"
                            onClick={() => setCategory(cat.value)}
                        >
                            <Icon className="h-4 w-4" />
                            {cat.label}
                        </Button>
                    );
                })}
                <Button variant="ghost" className="gap-2" onClick={fetchStats} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Stats content */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4" />
                    Carregando estatísticas...
                </div>
            ) : (
                renderContent()
            )}
        </div>
    );
};

const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    color: string;
}) => (
    <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

export default AdminStatistics;
