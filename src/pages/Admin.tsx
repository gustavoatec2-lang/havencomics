import { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, BarChart2, CheckCircle, Search, Ticket, Copy, Trash2, Star, Image, Edit, FileText, Upload, FileArchive, ImagePlus, ChevronDown, ChevronUp, UserPlus, Shield, Globe, Loader2, X, Check } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JSZip from 'jszip';
import { uploadToR2 } from '@/lib/r2-upload';
interface MangaForm {
  title: string;
  type: string;
  status: string;
  synopsis: string;
  author: string;
  artist: string;
  cover_url: string;
  banner_url: string;
  genres: string[];
  original_language: string;
  year_published: string;
  is_featured: boolean;
  is_weekly_highlight: boolean;
  is_home_highlight: boolean;
}

const initialForm: MangaForm = {
  title: '',
  type: 'manga',
  status: 'ongoing',
  synopsis: '',
  author: '',
  artist: '',
  cover_url: '',
  banner_url: '',
  genres: [],
  original_language: '',
  year_published: '',
  is_featured: false,
  is_weekly_highlight: false,
  is_home_highlight: false,
};

interface VipCode {
  id: string;
  code: string;
  tier: string;
  duration_days: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

// PlumaComics Scraper Types
interface PlumaManga {
  title: string;
  slug: string;
  cover: string;
  url: string;
  selected: boolean;
}

interface PlumaChapter {
  number: number;
  title: string;
  url: string;
  date: string;
  selected: boolean;
}

interface PlumaPage {
  index: number;
  url: string;
}

interface ScrapedChapterData {
  chapterNumber: number;
  pages: PlumaPage[];
  mangaTitle: string;
  mangaSlug: string;
}

// Proxy API Configurations
const PROXY_APIS = {
  scraperapi: {
    name: 'ScraperAPI',
    key: 'eb855778aa025de872984fb49aa7ca53',
    buildUrl: (url: string, render: boolean) =>
      `http://api.scraperapi.com?api_key=eb855778aa025de872984fb49aa7ca53&url=${encodeURIComponent(url)}${render ? '&render=true' : ''}`
  },
  scrapedo: {
    name: 'Scrape.do',
    key: '79c685acdbdb41fcb0d07438d4c06aa063197a2195d',
    buildUrl: (url: string, render: boolean) =>
      `https://api.scrape.do?token=79c685acdbdb41fcb0d07438d4c06aa063197a2195d&url=${encodeURIComponent(url)}${render ? '&render=true' : ''}`
  },
  scrapingant: {
    name: 'ScrapingAnt',
    key: '54d5a2ba397149579df44833368253b1',
    buildUrl: (url: string, render: boolean) =>
      `https://api.scrapingant.com/v2/general?x-api-key=54d5a2ba397149579df44833368253b1&url=${encodeURIComponent(url)}${render ? '&browser=true' : ''}`
  },
  abstractapi: {
    name: 'AbstractAPI',
    key: 'cbe8d524e87a4d17a5a1830fcc825f54',
    buildUrl: (url: string, _render: boolean) =>
      `https://scrape.abstractapi.com/v1/?api_key=cbe8d524e87a4d17a5a1830fcc825f54&url=${encodeURIComponent(url)}`
  },
  proxyscrape: {
    name: 'ProxyScrape',
    key: 'zz3ds84rezvt4o8ht704',
    buildUrl: (url: string, _render: boolean) =>
      `https://api.proxyscrape.com/v3/accounts/freebies/scraperapi/request?auth=zz3ds84rezvt4o8ht704&url=${encodeURIComponent(url)}`
  }
} as const;

type ProxyType = keyof typeof PROXY_APIS;

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [mangas, setMangas] = useState<any[]>([]);
  const [vipCodes, setVipCodes] = useState<VipCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingManga, setEditingManga] = useState<any>(null);
  const [form, setForm] = useState<MangaForm>(initialForm);
  const [vipForm, setVipForm] = useState({ tier: 'silver', duration: '30', quantity: '1' });
  const [chapterForm, setChapterForm] = useState({ manga_id: '', startNumber: '', endNumber: '', title: '', pages: '' });
  const [mangaSearch, setMangaSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, chapters: 0, completed: 0, ongoing: 0 });
  const [activeTab, setActiveTab] = useState('mangas');
  const [uploadedPages, setUploadedPages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [selectedMangaChapters, setSelectedMangaChapters] = useState<any[]>([]);
  const [chaptersMangaId, setChaptersMangaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);
  const editBannerInputRef = useRef<HTMLInputElement>(null);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  // PlumaComics Scraper States
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [scrapeSource, setScrapeSource] = useState<'plumacomics' | 'nexustoons' | 'coming_soon'>('plumacomics');
  const [scrapeStep, setScrapeStep] = useState<'source' | 'mangas' | 'chapters' | 'pages' | 'publish'>('source');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState('');
  // Manga list
  const [plumaMangas, setPlumaMangas] = useState<PlumaManga[]>([]);
  const [selectedPlumaManga, setSelectedPlumaManga] = useState<PlumaManga | null>(null);
  // Chapter list
  const [plumaChapters, setPlumaChapters] = useState<PlumaChapter[]>([]);
  // Scraped chapter pages
  const [scrapedChapters, setScrapedChapters] = useState<ScrapedChapterData[]>([]);
  // For publishing
  const [publishingChapter, setPublishingChapter] = useState<number | null>(null);
  // Proxy selection
  const [selectedProxy, setSelectedProxy] = useState<ProxyType>('scraperapi');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/entrar');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchMangas();
      fetchStats();
      fetchVipCodes();
    }
  }, [isAdmin]);

  const fetchMangas = async () => {
    const { data } = await supabase.from('mangas').select('*').order('created_at', { ascending: false });
    if (data) setMangas(data);
  };

  const fetchVipCodes = async () => {
    const { data } = await supabase.from('vip_codes').select('*').order('created_at', { ascending: false });
    if (data) setVipCodes(data);
  };

  const fetchStats = async () => {
    const { data: mangasData } = await supabase.from('mangas').select('status');
    const { data: chaptersData } = await supabase.from('chapters').select('id');

    if (mangasData) {
      setStats({
        total: mangasData.length,
        chapters: chaptersData?.length || 0,
        completed: mangasData.filter(m => m.status === 'completed').length,
        ongoing: mangasData.filter(m => m.status === 'ongoing').length,
      });
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateVipCodes = async () => {
    setIsSubmitting(true);
    const quantity = parseInt(vipForm.quantity);
    const duration = parseInt(vipForm.duration);

    const codes = [];
    for (let i = 0; i < quantity; i++) {
      codes.push({
        code: generateCode(),
        tier: vipForm.tier,
        duration_days: duration,
      });
    }

    const { error } = await supabase.from('vip_codes').insert(codes);

    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso!', description: `${quantity} código(s) VIP criado(s)` });
      setIsVipModalOpen(false);
      fetchVipCodes();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copiado!', description: 'Código copiado para a área de transferência' });
  };

  const deleteCode = async (id: string) => {
    const { error } = await supabase.from('vip_codes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deletado!', description: 'Código removido' });
      fetchVipCodes();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.cover_url) {
      toast({ title: 'Erro', description: 'Título e URL da capa são obrigatórios', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { error } = await supabase.from('mangas').insert([{
      title: form.title,
      slug,
      type: form.type as any,
      status: form.status as any,
      synopsis: form.synopsis,
      author: form.author,
      artist: form.artist,
      cover_url: form.cover_url,
      banner_url: form.banner_url,
      genres: form.genres,
      original_language: form.original_language,
      year_published: form.year_published ? parseInt(form.year_published) : null,
      is_featured: form.is_featured,
      is_weekly_highlight: form.is_weekly_highlight,
      is_home_highlight: form.is_home_highlight,
    }]);

    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso!', description: 'Obra adicionada com sucesso' });
      setIsModalOpen(false);
      setForm(initialForm);
      fetchMangas();
      fetchStats();
    }
  };

  const filteredMangas = mangas.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMangasForChapter = mangas.filter(m =>
    m.title.toLowerCase().includes(mangaSearch.toLowerCase())
  );

  const handleAddChapter = async () => {
    if (!chapterForm.manga_id || !chapterForm.startNumber) {
      toast({ title: 'Erro', description: 'Selecione uma obra e número do capítulo inicial', variant: 'destructive' });
      return;
    }

    const startNum = parseInt(chapterForm.startNumber);
    const endNum = chapterForm.endNumber ? parseInt(chapterForm.endNumber) : startNum;
    const totalChapters = endNum - startNum + 1;

    if (endNum < startNum) {
      toast({ title: 'Erro', description: 'O número final deve ser maior ou igual ao inicial', variant: 'destructive' });
      return;
    }

    // For multiple chapters, we need files uploaded
    if (totalChapters > 1 && uploadMode === 'url') {
      toast({ title: 'Erro', description: 'Para múltiplos capítulos, use upload de arquivos organizados em pastas', variant: 'destructive' });
      return;
    }

    // Check if we have pages from either URL or file upload
    const urlPages = chapterForm.pages.split('\n').map(p => p.trim()).filter(p => p);
    if (uploadMode === 'url' && urlPages.length === 0) {
      toast({ title: 'Erro', description: 'Adicione ao menos uma URL de página', variant: 'destructive' });
      return;
    }
    if (uploadMode === 'file' && uploadedPages.length === 0) {
      toast({ title: 'Erro', description: 'Faça upload de ao menos uma imagem', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const manga = mangas.find(m => m.id === chapterForm.manga_id);
    const mangaSlug = manga?.slug || chapterForm.manga_id;

    if (uploadMode === 'file' && totalChapters > 1) {
      // Multiple chapters - organize files by folder names or split evenly
      // Group files by folder prefix (e.g., "cap01/", "cap02/", "1/", "2/")
      const filesByChapter: Map<number, File[]> = new Map();

      for (const file of uploadedPages) {
        // Check if file has folder structure like "cap01/page.jpg" or "1/page.jpg"
        const pathParts = file.name.split('/');
        let chapterNum = startNum;

        if (pathParts.length > 1) {
          const folderName = pathParts[0];
          const match = folderName.match(/(\d+)/);
          if (match) {
            chapterNum = parseInt(match[1]);
          }
        } else {
          // If no folder structure, split evenly
          const pagesPerChapter = Math.ceil(uploadedPages.length / totalChapters);
          const fileIndex = uploadedPages.indexOf(file);
          chapterNum = startNum + Math.floor(fileIndex / pagesPerChapter);
        }

        if (chapterNum >= startNum && chapterNum <= endNum) {
          if (!filesByChapter.has(chapterNum)) {
            filesByChapter.set(chapterNum, []);
          }
          filesByChapter.get(chapterNum)!.push(file);
        }
      }

      let chaptersCreated = 0;
      for (let chapterNum = startNum; chapterNum <= endNum; chapterNum++) {
        const chapterFiles = filesByChapter.get(chapterNum) || [];
        if (chapterFiles.length === 0) continue;

        setUploadProgress(`Capítulo ${chapterNum}: Enviando 0/${chapterFiles.length}...`);

        const pagesArray: string[] = [];
        for (let i = 0; i < chapterFiles.length; i++) {
          const file = chapterFiles[i];
          const ext = file.name.split('.').pop() || 'jpg';
          const filePath = `chapters/${mangaSlug}/cap-${chapterNum}/page-${String(i + 1).padStart(3, '0')}.${ext}`;

          setUploadProgress(`Capítulo ${chapterNum}: Enviando ${i + 1}/${chapterFiles.length}...`);

          const result = await uploadToR2(file, filePath);

          if (!result.success) {
            toast({ title: 'Erro no upload', description: result.error || 'Falha no upload', variant: 'destructive' });
            setIsSubmitting(false);
            setUploadProgress('');
            return;
          }

          pagesArray.push(result.url!);
        }

        const { error } = await supabase.from('chapters').insert({
          manga_id: chapterForm.manga_id,
          number: chapterNum,
          title: null,
          pages: pagesArray,
        });

        if (error) {
          toast({ title: 'Erro', description: `Capítulo ${chapterNum}: ${error.message}`, variant: 'destructive' });
        } else {
          chaptersCreated++;
        }
      }

      setUploadProgress('');
      setIsSubmitting(false);
      toast({ title: 'Sucesso!', description: `${chaptersCreated} capítulo(s) adicionado(s)` });
      setIsChapterModalOpen(false);
      setChapterForm({ manga_id: '', startNumber: '', endNumber: '', title: '', pages: '' });
      setMangaSearch('');
      setUploadedPages([]);
      setUploadMode('url');
      fetchStats();
      return;
    }

    // Single chapter upload (original logic)
    let pagesArray: string[] = [];

    if (uploadMode === 'file') {
      setUploadProgress(`Enviando 0/${uploadedPages.length}...`);

      for (let i = 0; i < uploadedPages.length; i++) {
        const file = uploadedPages[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `chapters/${mangaSlug}/cap-${startNum}/page-${String(i + 1).padStart(3, '0')}.${ext}`;

        setUploadProgress(`Enviando ${i + 1}/${uploadedPages.length}...`);

        const result = await uploadToR2(file, filePath);

        if (!result.success) {
          toast({ title: 'Erro no upload', description: result.error || 'Falha no upload', variant: 'destructive' });
          setIsSubmitting(false);
          setUploadProgress('');
          return;
        }

        pagesArray.push(result.url!);
      }
      setUploadProgress('');
    } else {
      pagesArray = urlPages;
    }

    const { error } = await supabase.from('chapters').insert({
      manga_id: chapterForm.manga_id,
      number: startNum,
      title: chapterForm.title || null,
      pages: pagesArray,
    });

    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso!', description: 'Capítulo adicionado' });
      setIsChapterModalOpen(false);
      setChapterForm({ manga_id: '', startNumber: '', endNumber: '', title: '', pages: '' });
      setMangaSearch('');
      setUploadedPages([]);
      setUploadMode('url');
      fetchStats();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    setUploadedPages(prev => [...prev, ...imageFiles]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress('Extraindo ZIP...');

    try {
      const zip = await JSZip.loadAsync(file);
      const imageFiles: File[] = [];

      const entries = Object.keys(zip.files).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );

      for (const fileName of entries) {
        const zipEntry = zip.files[fileName];
        if (zipEntry.dir) continue;

        const ext = fileName.split('.').pop()?.toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) continue;

        const blob = await zipEntry.async('blob');
        const imageFile = new File([blob], fileName.split('/').pop() || fileName, {
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`
        });
        imageFiles.push(imageFile);
      }

      setUploadedPages(prev => [...prev, ...imageFiles]);
      setUploadProgress('');
      toast({ title: 'ZIP extraído', description: `${imageFiles.length} imagens encontradas` });
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao extrair ZIP', variant: 'destructive' });
      setUploadProgress('');
    }

    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  const removeUploadedPage = (index: number) => {
    setUploadedPages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditManga = (manga: any) => {
    setEditingManga(manga);
    setForm({
      title: manga.title,
      type: manga.type,
      status: manga.status,
      synopsis: manga.synopsis || '',
      author: manga.author || '',
      artist: manga.artist || '',
      cover_url: manga.cover_url || '',
      banner_url: manga.banner_url || '',
      genres: manga.genres || [],
      original_language: manga.original_language || '',
      year_published: manga.year_published?.toString() || '',
      is_featured: manga.is_featured || false,
      is_weekly_highlight: manga.is_weekly_highlight || false,
      is_home_highlight: manga.is_home_highlight || false,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateManga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManga) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('mangas').update({
      title: form.title,
      type: form.type as any,
      status: form.status as any,
      synopsis: form.synopsis,
      author: form.author,
      artist: form.artist,
      cover_url: form.cover_url,
      banner_url: form.banner_url,
      genres: form.genres,
      original_language: form.original_language,
      year_published: form.year_published ? parseInt(form.year_published) : null,
      is_featured: form.is_featured,
      is_weekly_highlight: form.is_weekly_highlight,
      is_home_highlight: form.is_home_highlight,
    }).eq('id', editingManga.id);

    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso!', description: 'Obra atualizada' });
      setIsEditModalOpen(false);
      setEditingManga(null);
      setForm(initialForm);
      fetchMangas();
    }
  };

  const handleDeleteManga = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${title}"? Esta ação não pode ser desfeita.`)) return;

    const { error } = await supabase.from('mangas').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Excluído!', description: 'Obra removida com sucesso' });
      fetchMangas();
      fetchStats();
    }
  };

  const fetchMangaChapters = async (mangaId: string) => {
    if (chaptersMangaId === mangaId) {
      setChaptersMangaId(null);
      setSelectedMangaChapters([]);
      return;
    }
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('manga_id', mangaId)
      .order('number', { ascending: true });
    setSelectedMangaChapters(data || []);
    setChaptersMangaId(mangaId);
  };

  const handleDeleteChapter = async (chapterId: string, chapterNumber: number) => {
    if (!confirm(`Excluir capítulo ${chapterNumber}?`)) return;

    const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Excluído!', description: `Capítulo ${chapterNumber} removido` });
      setSelectedMangaChapters(prev => prev.filter(c => c.id !== chapterId));
      fetchStats();
    }
  };

  // ==================== PlumaComics Scraper Functions ====================

  // Helper: fetch with retry for scrape.do API
  const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) return response;
        if (response.status === 502 || response.status === 503) {
          if (i < retries) {
            setScrapeStatus(`Erro temporário, tentando novamente (${i + 1}/${retries})...`);
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (e) {
        if (i === retries) throw e;
        setScrapeStatus(`Reconectando (${i + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    throw new Error('Max retries reached');
  };

  // Fetch manga list from PlumaComics hotslid
  const fetchPlumaMangas = async () => {
    setIsScraping(true);
    setScrapeStatus('Carregando lista de mangás do PlumaComics...');
    setPlumaMangas([]);

    try {
      const targetUrl = 'https://plumacomics.cloud/';
      const apiUrl = PROXY_APIS[selectedProxy].buildUrl(targetUrl, true);

      const response = await fetchWithRetry(apiUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Find all manga cards in the hotslid section
      const mangaCards = doc.querySelectorAll('.hotslid .bs .bsx a');
      const mangaList: PlumaManga[] = [];

      mangaCards.forEach((card) => {
        const title = card.getAttribute('title') || '';
        const url = card.getAttribute('href') || '';
        const img = card.querySelector('img');
        const cover = img?.getAttribute('src') || img?.getAttribute('data-src') || '';

        // Extract slug from URL
        const slugMatch = url.match(/\/manga\/([^\/]+)\/?$/);
        const slug = slugMatch ? slugMatch[1] : '';

        if (title && slug) {
          mangaList.push({
            title,
            slug,
            cover,
            url,
            selected: false
          });
        }
      });

      setPlumaMangas(mangaList);
      setScrapeStatus(`${mangaList.length} mangás encontrados`);
      toast({ title: 'Sucesso!', description: `${mangaList.length} mangás encontrados` });

      if (mangaList.length > 0) {
        setScrapeStep('mangas');
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setScrapeStatus('Erro ao carregar mangás - tente novamente');
    }

    setIsScraping(false);
  };

  // Fetch chapters for selected manga
  const fetchPlumaChapters = async (manga: PlumaManga) => {
    setIsScraping(true);
    setSelectedPlumaManga(manga);
    setScrapeStatus(`Carregando capítulos de ${manga.title}...`);
    setPlumaChapters([]);

    try {
      const apiUrl = PROXY_APIS[selectedProxy].buildUrl(manga.url, true);

      const response = await fetchWithRetry(apiUrl);

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Find all chapter boxes
      const chapterBoxes = doc.querySelectorAll('.chbox .eph-num a');
      const chapterList: PlumaChapter[] = [];

      chapterBoxes.forEach((chapterEl) => {
        const url = chapterEl.getAttribute('href') || '';
        const numEl = chapterEl.querySelector('.chapternum');
        const dateEl = chapterEl.querySelector('.chapterdate');

        const chapterText = numEl?.textContent?.trim() || '';
        const date = dateEl?.textContent?.trim() || '';

        // Extract chapter number from text like "Capítulo 16"
        const numMatch = chapterText.match(/(\d+)/);
        const number = numMatch ? parseInt(numMatch[1]) : 0;

        if (number > 0) {
          chapterList.push({
            number,
            title: chapterText,
            url,
            date,
            selected: false
          });
        }
      });

      // Sort chapters by number (descending - newest first)
      chapterList.sort((a, b) => b.number - a.number);

      setPlumaChapters(chapterList);
      setScrapeStatus(`${chapterList.length} capítulos encontrados`);
      toast({ title: 'Sucesso!', description: `${chapterList.length} capítulos encontrados` });

      if (chapterList.length > 0) {
        setScrapeStep('chapters');
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setScrapeStatus('Erro ao carregar capítulos');
    }

    setIsScraping(false);
  };

  // Toggle chapter selection
  const toggleChapterSelection = (chapterNumber: number) => {
    setPlumaChapters(prev => prev.map(ch =>
      ch.number === chapterNumber ? { ...ch, selected: !ch.selected } : ch
    ));
  };

  // Select/deselect all chapters
  const toggleAllChapters = () => {
    const allSelected = plumaChapters.every(ch => ch.selected);
    setPlumaChapters(prev => prev.map(ch => ({ ...ch, selected: !allSelected })));
  };

  // Scrape pages from selected chapters
  const scrapeSelectedChapters = async () => {
    const selectedChaps = plumaChapters.filter(ch => ch.selected);
    if (selectedChaps.length === 0) {
      toast({ title: 'Erro', description: 'Selecione pelo menos um capítulo', variant: 'destructive' });
      return;
    }

    if (!selectedPlumaManga) return;

    setIsScraping(true);
    setScrapedChapters([]);
    setScrapeStep('pages');

    const results: ScrapedChapterData[] = [];

    for (let i = 0; i < selectedChaps.length; i++) {
      const chapter = selectedChaps[i];
      setScrapeStatus(`Extraindo capítulo ${chapter.number} (${i + 1}/${selectedChaps.length})...`);

      try {
        // Use the URL directly from the scraped chapter data
        const chapterUrl = chapter.url;
        const apiUrl = PROXY_APIS[selectedProxy].buildUrl(chapterUrl, true);

        // Keep trying until successful
        let html = '';
        let attempt = 0;
        while (true) {
          attempt++;
          setScrapeStatus(`Capítulo ${chapter.number} - tentativa ${attempt}...`);

          try {
            const response = await fetch(apiUrl);
            if (response.ok) {
              html = await response.text();
              break; // Success!
            }
            console.log(`Attempt ${attempt} failed with ${response.status}, retrying...`);
          } catch (e) {
            console.log(`Attempt ${attempt} failed with error, retrying...`);
          }

          // Wait 3 seconds before retry
          await new Promise(r => setTimeout(r, 3000));
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Find all page images - different selector based on source
        const pageSelector = scrapeSource === 'nexustoons' ? 'img.manga-page-image' : 'img.ts-main-image';
        const pageImages = doc.querySelectorAll(pageSelector);
        const pages: PlumaPage[] = [];

        pageImages.forEach((img, idx) => {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
          if (src && !src.includes('placeholder')) {
            pages.push({
              index: idx,
              url: src
            });
          }
        });

        // Sort pages by index
        pages.sort((a, b) => a.index - b.index);

        if (pages.length > 0) {
          results.push({
            chapterNumber: chapter.number,
            pages,
            mangaTitle: selectedPlumaManga.title,
            mangaSlug: selectedPlumaManga.slug
          });
        }

        // Update UI progressively
        setScrapedChapters([...results]);

      } catch (error: any) {
        toast({
          title: `Erro no capítulo ${chapter.number}`,
          description: error.message,
          variant: 'destructive'
        });
      }

      // Small delay between requests
      if (i < selectedChaps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsScraping(false);
    setScrapeStatus(`${results.length} capítulo(s) extraído(s)`);

    if (results.length > 0) {
      setScrapeStep('publish');
      toast({ title: 'Concluído!', description: `${results.length} capítulo(s) prontos para publicar` });
    }
  };

  // Publish a chapter to the site
  const publishChapter = async (chapterData: ScrapedChapterData) => {
    if (!selectedPlumaManga) return;

    setPublishingChapter(chapterData.chapterNumber);

    try {
      // First, find or create the manga in our database
      let { data: existingManga } = await supabase
        .from('mangas')
        .select('id')
        .eq('slug', selectedPlumaManga.slug)
        .single();

      let mangaId = existingManga?.id;

      // If manga doesn't exist, scrape full details and create it
      if (!mangaId) {
        setScrapeStatus('Extraindo dados da obra...');

        // Fetch manga page to get full details
        let synopsis = '';
        let author = '';
        let artist = '';
        let mangaType: 'manga' | 'manhwa' | 'manhua' | 'novel' | 'webtoon' = 'manhua';
        let genres: string[] = [];

        try {
          const apiUrl = PROXY_APIS[selectedProxy].buildUrl(selectedPlumaManga.url, true);
          const response = await fetch(apiUrl);

          if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract synopsis
            const synopsisEl = doc.querySelector('.entry-content[itemprop="description"]') ||
              doc.querySelector('.synp p') ||
              doc.querySelector('.summary__content p') ||
              doc.querySelector('.desc p');
            if (synopsisEl) {
              synopsis = synopsisEl.textContent?.trim() || '';
            }

            // Extract author/artist from info table
            const infoItems = doc.querySelectorAll('.infox .flex-wrap span, .tsinfo .imptdt');
            infoItems.forEach(item => {
              const text = item.textContent?.toLowerCase() || '';
              const value = item.querySelector('a, i')?.textContent?.trim() ||
                item.textContent?.replace(/autor|artista|artist|author|tipo|type/gi, '').trim() || '';

              if (text.includes('autor') || text.includes('author')) {
                author = value;
              }
              if (text.includes('artista') || text.includes('artist')) {
                artist = value;
              }
              if (text.includes('tipo') || text.includes('type')) {
                const typeText = value.toLowerCase();
                if (typeText.includes('manhua')) mangaType = 'manhua';
                else if (typeText.includes('manhwa')) mangaType = 'manhwa';
                else if (typeText.includes('manga')) mangaType = 'manga';
              }
            });

            // Extract genres
            const genreEls = doc.querySelectorAll('.mgen a, .genres-content a, .genre-item a');
            genreEls.forEach(el => {
              const genre = el.textContent?.trim();
              if (genre && !genres.includes(genre)) {
                genres.push(genre);
              }
            });
          }
        } catch (e) {
          console.log('Failed to fetch manga details, using defaults');
        }

        const { data: newManga, error: mangaError } = await supabase
          .from('mangas')
          .insert({
            title: selectedPlumaManga.title,
            slug: selectedPlumaManga.slug,
            cover_url: selectedPlumaManga.cover,
            type: mangaType,
            status: 'ongoing',
            synopsis: synopsis || `Importado de PlumaComics`,
            author: author || undefined,
            artist: artist || undefined,
            genres: genres.length > 0 ? genres : undefined
          })
          .select('id')
          .single();

        if (mangaError) throw mangaError;
        mangaId = newManga.id;
        fetchMangas(); // Refresh manga list
        toast({ title: 'Obra criada!', description: selectedPlumaManga.title });
      }

      // Download and upload each page image to our storage
      setScrapeStatus(`Fazendo upload das páginas do capítulo ${chapterData.chapterNumber}...`);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < chapterData.pages.length; i++) {
        const page = chapterData.pages[i];
        setScrapeStatus(`Página ${i + 1}/${chapterData.pages.length}...`);

        try {
          // Fetch image through proxy to avoid CORS
          const proxyUrl = PROXY_APIS[selectedProxy].buildUrl(page.url, false);
          const imgResponse = await fetch(proxyUrl);
          if (!imgResponse.ok) throw new Error('Failed to fetch page');

          const blob = await imgResponse.blob();
          const ext = page.url.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `page-${String(i + 1).padStart(3, '0')}.${ext}`;

          // Upload directly to Supabase Storage
          const path = `chapters/${chapterData.mangaSlug}/cap-${chapterData.chapterNumber}/${fileName}`;
          const { data, error } = await supabase.storage
            .from('manga-content')
            .upload(path, blob, {
              contentType: blob.type || 'image/jpeg',
              upsert: true
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('manga-content')
            .getPublicUrl(path);

          uploadedUrls.push(urlData.publicUrl);
        } catch (e: any) {
          console.error(`Failed to upload page ${i + 1}:`, e);
          // Fallback to original URL if upload fails
          uploadedUrls.push(page.url);
        }
      }

      const { error: chapterError } = await supabase
        .from('chapters')
        .insert({
          manga_id: mangaId,
          number: chapterData.chapterNumber,
          pages: uploadedUrls
        });

      if (chapterError) throw chapterError;

      toast({
        title: 'Publicado!',
        description: `Capítulo ${chapterData.chapterNumber} publicado com sucesso`
      });

      // Remove from scraped list
      setScrapedChapters(prev => prev.filter(ch => ch.chapterNumber !== chapterData.chapterNumber));
      fetchStats();

    } catch (error: any) {
      toast({
        title: 'Erro ao publicar',
        description: error.message,
        variant: 'destructive'
      });
    }

    setPublishingChapter(null);
  };

  // Reset scraper state
  const resetScraper = () => {
    setScrapeStep('source');
    setPlumaMangas([]);
    setSelectedPlumaManga(null);
    setPlumaChapters([]);
    setScrapedChapters([]);
    setScrapeStatus('');
  };

  // ==================== NexusToons Scraper Functions ====================

  // Fetch manga list from NexusToons trending carousel
  const fetchNexusMangas = async () => {
    setIsScraping(true);
    setScrapeStatus('Carregando lista de mangás do NexusToons...');
    setPlumaMangas([]);

    try {
      const targetUrl = 'https://nexustoons.site/';
      // NexusToons uses SSR, so we don't need render=true (much faster!)
      const apiUrl = PROXY_APIS[selectedProxy].buildUrl(targetUrl, false);

      const response = await fetchWithRetry(apiUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Find all manga cards in the trending carousel
      const mangaCards = doc.querySelectorAll('.embla__slide a.content-card');
      const mangaList: PlumaManga[] = [];

      mangaCards.forEach((card) => {
        const titleEl = card.querySelector('h3');
        const title = titleEl?.textContent?.trim() || '';
        const url = card.getAttribute('href') || '';
        // Try multiple selectors and attributes for the cover image
        const img = card.querySelector('img.content-cover') || card.querySelector('img');
        const cover = img?.getAttribute('src') || img?.getAttribute('data-src') || img?.getAttribute('data-lazy-src') || '';

        // Extract slug from URL (e.g., /manga/slug-name/)
        const slugMatch = url.match(/\/manga\/([^\/]+)\/?/);
        const slug = slugMatch ? slugMatch[1] : '';

        // Build full URL if relative
        const fullUrl = url.startsWith('http') ? url : `https://nexustoons.site${url}`;

        if (title && slug) {
          mangaList.push({
            title,
            slug,
            cover,
            url: fullUrl,
            selected: false
          });
        }
      });

      setPlumaMangas(mangaList);
      setScrapeStatus(`${mangaList.length} mangás encontrados`);
      toast({ title: 'Sucesso!', description: `${mangaList.length} mangás encontrados` });

      if (mangaList.length > 0) {
        setScrapeStep('mangas');
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setScrapeStatus('Erro ao carregar mangás - tente novamente');
    }

    setIsScraping(false);
  };

  // Fetch chapters for selected manga from NexusToons
  const fetchNexusChapters = async (manga: PlumaManga) => {
    setIsScraping(true);
    setSelectedPlumaManga(manga);
    setScrapeStatus(`Carregando capítulos de ${manga.title}...`);
    setPlumaChapters([]);

    try {
      // NexusToons uses SSR, so we don't need render=true (much faster!)
      const apiUrl = PROXY_APIS[selectedProxy].buildUrl(manga.url, false);

      const response = await fetchWithRetry(apiUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Find all chapter items
      const chapterItems = doc.querySelectorAll('a.chapter-item');
      const chapterList: PlumaChapter[] = [];

      chapterItems.forEach((chapterEl) => {
        const url = chapterEl.getAttribute('href') || '';
        const chapterNumber = chapterEl.getAttribute('data-chapter-number');
        const number = chapterNumber ? parseInt(chapterNumber) : 0;

        // Get date from the chapter-date element
        const dateEl = chapterEl.querySelector('.chapter-date');
        const date = dateEl?.textContent?.trim() || '';

        // Build full URL if relative
        const fullUrl = url.startsWith('http') ? url : `https://nexustoons.site${url}`;

        if (number > 0) {
          chapterList.push({
            number,
            title: `Capítulo ${number}`,
            url: fullUrl,
            date,
            selected: false
          });
        }
      });

      // Sort chapters by number (descending - newest first)
      chapterList.sort((a, b) => b.number - a.number);

      setPlumaChapters(chapterList);
      setScrapeStatus(`${chapterList.length} capítulos encontrados`);
      toast({ title: 'Sucesso!', description: `${chapterList.length} capítulos encontrados` });

      if (chapterList.length > 0) {
        setScrapeStep('chapters');
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setScrapeStatus('Erro ao carregar capítulos');
    }

    setIsScraping(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie todas as obras, capítulos e conteúdo do site</p>
        </div>

        {/* Stats */}
        <section className="mb-8">
          <h2 className="text-xl font-display font-bold mb-4">Resumo Geral</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Títulos Totais</span>
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Obras cadastradas</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Capítulos</span>
                <div className="h-8 w-8 rounded-full bg-info/20 flex items-center justify-center">
                  <BarChart2 className="h-4 w-4 text-info" />
                </div>
              </div>
              <p className="text-3xl font-bold">{stats.chapters}</p>
              <p className="text-xs text-muted-foreground">Total publicados</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Códigos VIP</span>
                <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-warning" />
                </div>
              </div>
              <p className="text-3xl font-bold">{vipCodes.filter(c => !c.is_used).length}</p>
              <p className="text-xs text-muted-foreground">Disponíveis</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">VIP Ativos</span>
                <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
              </div>
              <p className="text-3xl font-bold">{vipCodes.filter(c => c.is_used).length}</p>
              <p className="text-xs text-muted-foreground">Códigos utilizados</p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="mangas">Mangás</TabsTrigger>
            <TabsTrigger value="destaque">Destaque</TabsTrigger>
            <TabsTrigger value="vip">Códigos VIP</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="mangas">
            {/* Quick Actions */}
            <section className="mb-8">
              <h2 className="text-xl font-display font-bold mb-4">Ações Rápidas</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Adicionar Nova Obra
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setIsChapterModalOpen(true)}>
                  <FileText className="h-4 w-4" /> Adicionar Novo Capítulo
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => navigate('/catalogo')}>
                  <BookOpen className="h-4 w-4" /> Ver Catálogo
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setIsScrapeModalOpen(true)}>
                  <Globe className="h-4 w-4" /> Scrape
                </Button>
              </div>
            </section>

            {/* Content Management */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold">Gerenciar Conteúdo</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Capa</th>
                      <th className="text-left p-4 text-sm font-medium">Título</th>
                      <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Informações</th>
                      <th className="text-right p-4 text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMangas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nenhuma obra encontrada
                        </td>
                      </tr>
                    ) : (
                      filteredMangas.map((manga) => (
                        <Fragment key={manga.id}>
                          <tr className="border-t border-border">
                            <td className="p-4">
                              <div className="w-12 h-16 rounded overflow-hidden bg-secondary">
                                {manga.cover_url && (
                                  <img src={manga.cover_url} alt={manga.title} className="w-full h-full object-cover" />
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-medium">{manga.title}</p>
                              <p className="text-sm text-muted-foreground">Por {manga.author || 'Desconhecido'}</p>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <div className="flex flex-wrap gap-1 mb-2">
                                <Badge variant="secondary">{manga.type}</Badge>
                                <Badge variant={manga.status === 'ongoing' ? 'success' : 'info'}>
                                  {manga.status === 'ongoing' ? 'Em Andamento' : manga.status === 'completed' ? 'Completo' : manga.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Atualizado: {new Date(manga.updated_at).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => fetchMangaChapters(manga.id)} title="Ver capítulos">
                                  {chaptersMangaId === manga.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditManga(manga)} title="Editar">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteManga(manga.id, manga.title)} title="Excluir">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {chaptersMangaId === manga.id && (
                            <tr key={`${manga.id}-chapters`} className="bg-secondary/30">
                              <td colSpan={4} className="p-4">
                                <div className="space-y-2">
                                  <p className="font-medium text-sm mb-3">Capítulos de {manga.title}</p>
                                  {selectedMangaChapters.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nenhum capítulo</p>
                                  ) : (
                                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                                      {selectedMangaChapters.map((chapter) => (
                                        <div key={chapter.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
                                          <div>
                                            <span className="font-medium">Cap. {chapter.number}</span>
                                            {chapter.title && <span className="text-muted-foreground ml-2">- {chapter.title}</span>}
                                            <span className="text-xs text-muted-foreground ml-2">
                                              ({chapter.pages?.length || 0} páginas)
                                            </span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteChapter(chapter.id, chapter.number)}
                                            className="h-8 w-8"
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="destaque">
            {/* Featured Manga Selection */}
            <section className="space-y-6">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Star className="h-5 w-5" />
                Gerenciar Destaque da Home
              </h2>
              <p className="text-muted-foreground text-sm">
                Selecione uma obra existente para aparecer como destaque principal na página inicial
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Featured */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-medium mb-4">Destaque Atual</h3>
                  {mangas.filter(m => m.is_home_highlight).length > 0 ? (
                    mangas.filter(m => m.is_home_highlight).map(manga => (
                      <div key={manga.id} className="flex items-center gap-4">
                        <div className="w-16 h-20 rounded overflow-hidden bg-secondary">
                          {manga.cover_url && <img src={manga.cover_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{manga.title}</p>
                          <Badge variant="secondary" className="text-xs">{manga.type}</Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={async () => {
                          await supabase.from('mangas').update({ is_home_highlight: false }).eq('id', manga.id);
                          fetchMangas();
                          toast({ title: 'Removido do destaque' });
                        }}>
                          Remover
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Nenhuma obra em destaque</p>
                  )}
                </div>

                {/* Select New Featured */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-medium mb-4">Selecionar Nova Obra</h3>
                  <div className="space-y-4">
                    <Select onValueChange={async (mangaId) => {
                      // Remove current highlight
                      await supabase.from('mangas').update({ is_home_highlight: false }).neq('id', '');
                      // Set new highlight
                      await supabase.from('mangas').update({ is_home_highlight: true }).eq('id', mangaId);
                      fetchMangas();
                      toast({ title: 'Destaque atualizado!' });
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma obra" />
                      </SelectTrigger>
                      <SelectContent>
                        {mangas.map(manga => (
                          <SelectItem key={manga.id} value={manga.id}>
                            {manga.title} ({manga.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Banner Image Section */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Imagem de Fundo do Destaque
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Defina a URL do banner para a obra em destaque. A imagem ficará com blur no fundo.
                </p>
                {mangas.filter(m => m.is_home_highlight).map(manga => (
                  <div key={manga.id} className="space-y-4">
                    <Input
                      placeholder="URL da imagem de fundo"
                      defaultValue={manga.banner_url || ''}
                      onBlur={async (e) => {
                        await supabase.from('mangas').update({ banner_url: e.target.value }).eq('id', manga.id);
                        fetchMangas();
                        toast({ title: 'Banner atualizado!' });
                      }}
                    />
                    {manga.banner_url && (
                      <div className="relative h-32 rounded-lg overflow-hidden">
                        <img src={manga.banner_url} alt="" className="w-full h-full object-cover blur-sm" />
                        <div className="absolute inset-0 bg-background/60" />
                        <p className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                          Preview do fundo com blur
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {mangas.filter(m => m.is_home_highlight).length === 0 && (
                  <p className="text-muted-foreground text-sm">Selecione uma obra primeiro</p>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="vip">
            {/* VIP Quick Actions */}
            <section className="mb-8">
              <h2 className="text-xl font-display font-bold mb-4">Gerenciar Códigos VIP</h2>
              <Button variant="outline" className="gap-2" onClick={() => setIsVipModalOpen(true)}>
                <Plus className="h-4 w-4" /> Criar Códigos VIP
              </Button>
            </section>

            {/* VIP Codes Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Código</th>
                    <th className="text-left p-4 text-sm font-medium">Tier</th>
                    <th className="text-left p-4 text-sm font-medium">Duração</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                    <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Criado em</th>
                    <th className="text-right p-4 text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vipCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhum código VIP criado
                      </td>
                    </tr>
                  ) : (
                    vipCodes.map((code) => (
                      <tr key={code.id} className="border-t border-border">
                        <td className="p-4">
                          <code className="bg-secondary px-2 py-1 rounded text-sm font-mono">{code.code}</code>
                        </td>
                        <td className="p-4">
                          <Badge variant={code.tier === 'gold' ? 'warning' : 'secondary'} className="capitalize">
                            {code.tier}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{code.duration_days} dias</td>
                        <td className="p-4">
                          <Badge variant={code.is_used ? 'destructive' : 'success'}>
                            {code.is_used ? 'Usado' : 'Disponível'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                          {new Date(code.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => copyCode(code.code)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            {!code.is_used && (
                              <Button variant="ghost" size="icon" onClick={() => deleteCode(code.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="admins">
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gerenciar Administradores
                </h2>
                <Button className="gap-2" onClick={() => setIsAddAdminModalOpen(true)}>
                  <UserPlus className="h-4 w-4" /> Adicionar Admin
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                Adicione novos administradores inserindo o email da conta do usuário.
              </p>

              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">
                  Clique em "Adicionar Admin" para promover um usuário existente a administrador.
                </p>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Manga Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Obra</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Informações Básicas</h3>
              <div className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    placeholder="Ex: Solo Leveling"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo *</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manga">Manga</SelectItem>
                        <SelectItem value="manhwa">Manhwa</SelectItem>
                        <SelectItem value="manhua">Manhua</SelectItem>
                        <SelectItem value="novel">Novel</SelectItem>
                        <SelectItem value="webtoon">Webtoon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status *</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ongoing">Em Andamento</SelectItem>
                        <SelectItem value="completed">Completo</SelectItem>
                        <SelectItem value="hiatus">Hiato</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Sinopse</Label>
                  <Textarea
                    placeholder="Descreva a história..."
                    value={form.synopsis}
                    onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Imagens</h3>
              <div className="space-y-4">
                <div>
                  <Label>Capa *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL ou faça upload"
                      value={form.cover_url}
                      onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                      className="flex-1"
                    />
                    <input
                      type="file"
                      ref={coverInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !form.title) {
                          toast({ title: 'Erro', description: 'Preencha o título primeiro', variant: 'destructive' });
                          return;
                        }
                        setCoverUploading(true);
                        const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const ext = file.name.split('.').pop() || 'jpg';
                        const path = `covers/${slug}/cover.${ext}`;
                        const result = await uploadToR2(file, path);
                        setCoverUploading(false);
                        if (result.success) {
                          setForm({ ...form, cover_url: result.url! });
                          toast({ title: 'Upload concluído!' });
                        } else {
                          toast({ title: 'Erro', description: result.error, variant: 'destructive' });
                        }
                        if (coverInputRef.current) coverInputRef.current.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={coverUploading}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {coverUploading ? <span className="animate-spin">⏳</span> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.cover_url && (
                    <div className="mt-2 w-20 h-28 rounded overflow-hidden bg-secondary">
                      <img src={form.cover_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Banner (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL ou faça upload"
                      value={form.banner_url}
                      onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                      className="flex-1"
                    />
                    <input
                      type="file"
                      ref={bannerInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !form.title) {
                          toast({ title: 'Erro', description: 'Preencha o título primeiro', variant: 'destructive' });
                          return;
                        }
                        setBannerUploading(true);
                        const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const ext = file.name.split('.').pop() || 'jpg';
                        const path = `banners/${slug}/banner.${ext}`;
                        const result = await uploadToR2(file, path);
                        setBannerUploading(false);
                        if (result.success) {
                          setForm({ ...form, banner_url: result.url! });
                          toast({ title: 'Upload concluído!' });
                        } else {
                          toast({ title: 'Erro', description: result.error, variant: 'destructive' });
                        }
                        if (bannerInputRef.current) bannerInputRef.current.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={bannerUploading}
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      {bannerUploading ? <span className="animate-spin">⏳</span> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.banner_url && (
                    <div className="mt-2 h-20 rounded overflow-hidden bg-secondary">
                      <img src={form.banner_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Informações Adicionais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Autor</Label>
                  <Input
                    placeholder="Nome do autor"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Artista</Label>
                  <Input
                    placeholder="Nome do artista"
                    value={form.artist}
                    onChange={(e) => setForm({ ...form, artist: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Configurações de Destaque</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Destaque da Semana</p>
                    <p className="text-xs text-muted-foreground">Aparece no banner principal</p>
                  </div>
                  <Switch
                    checked={form.is_weekly_highlight}
                    onCheckedChange={(v) => setForm({ ...form, is_weekly_highlight: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Mangás em Destaque</p>
                    <p className="text-xs text-muted-foreground">Seção de obras em destaque</p>
                  </div>
                  <Switch
                    checked={form.is_featured}
                    onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Em Destaque na Home</p>
                    <p className="text-xs text-muted-foreground">Aparece na página inicial</p>
                  </div>
                  <Switch
                    checked={form.is_home_highlight}
                    onCheckedChange={(v) => setForm({ ...form, is_home_highlight: v })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adicionando...' : 'Adicionar Obra'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create VIP Code Modal */}
      <Dialog open={isVipModalOpen} onOpenChange={setIsVipModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Códigos VIP</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tier</Label>
              <Select value={vipForm.tier} onValueChange={(v) => setVipForm({ ...vipForm, tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Duração (dias)</Label>
              <Select value={vipForm.duration} onValueChange={(v) => setVipForm({ ...vipForm, duration: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantidade de códigos</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={vipForm.quantity}
                onChange={(e) => setVipForm({ ...vipForm, quantity: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsVipModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateVipCodes} disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Códigos'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Chapter Modal */}
      <Dialog open={isChapterModalOpen} onOpenChange={setIsChapterModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Capítulo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Selecionar Obra *</Label>
              <Input
                placeholder="Digite para buscar..."
                value={mangaSearch}
                onChange={(e) => setMangaSearch(e.target.value)}
                className="mb-2"
              />
              {mangaSearch && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                  {filteredMangasForChapter.slice(0, 10).map(manga => (
                    <button
                      key={manga.id}
                      type="button"
                      className={`w-full text-left p-3 hover:bg-secondary flex items-center gap-3 ${chapterForm.manga_id === manga.id ? 'bg-secondary' : ''}`}
                      onClick={() => {
                        setChapterForm({ ...chapterForm, manga_id: manga.id });
                        setMangaSearch(manga.title);
                      }}
                    >
                      <div className="w-8 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        {manga.cover_url && <img src={manga.cover_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{manga.title}</p>
                        <p className="text-xs text-muted-foreground">{manga.type}</p>
                      </div>
                    </button>
                  ))}
                  {filteredMangasForChapter.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">Nenhuma obra encontrada</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Capítulo Inicial *</Label>
                <Input
                  type="number"
                  placeholder="Ex: 1"
                  value={chapterForm.startNumber}
                  onChange={(e) => setChapterForm({ ...chapterForm, startNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Capítulo Final (opcional)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 10"
                  value={chapterForm.endNumber}
                  onChange={(e) => setChapterForm({ ...chapterForm, endNumber: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Para múltiplos caps</p>
              </div>
              <div>
                <Label>Título (Opcional)</Label>
                <Input
                  placeholder="Ex: O Início"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Páginas do Capítulo</Label>
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  variant={uploadMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('url')}
                >
                  URLs
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('file')}
                >
                  Upload de Arquivos
                </Button>
              </div>

              {uploadMode === 'url' ? (
                <>
                  <p className="text-xs text-muted-foreground mb-2">Uma URL por linha</p>
                  <Textarea
                    placeholder="https://exemplo.com/pagina1.jpg&#10;https://exemplo.com/pagina2.jpg"
                    value={chapterForm.pages}
                    onChange={(e) => setChapterForm({ ...chapterForm, pages: e.target.value })}
                    rows={5}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleZipUpload}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Adicionar Imagens
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => zipInputRef.current?.click()}
                    >
                      <FileArchive className="h-4 w-4 mr-2" />
                      Enviar ZIP
                    </Button>
                  </div>

                  {uploadProgress && (
                    <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                  )}

                  {uploadedPages.length > 0 && (
                    <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
                      <p className="text-sm font-medium mb-2">{uploadedPages.length} página(s) selecionada(s)</p>
                      <div className="space-y-1">
                        {uploadedPages.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
                            <span className="truncate mr-2">{idx + 1}. {file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeUploadedPage(idx)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => {
                setIsChapterModalOpen(false);
                setChapterForm({ manga_id: '', startNumber: '', endNumber: '', title: '', pages: '' });
                setMangaSearch('');
                setUploadedPages([]);
                setUploadMode('url');
              }}>
                Cancelar
              </Button>
              <Button onClick={handleAddChapter} disabled={isSubmitting}>
                {isSubmitting ? (uploadProgress || 'Adicionando...') : 'Adicionar Capítulo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Manga Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Obra</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateManga} className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Informações Básicas</h3>
              <div className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    placeholder="Ex: Solo Leveling"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo *</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manga">Manga</SelectItem>
                        <SelectItem value="manhwa">Manhwa</SelectItem>
                        <SelectItem value="manhua">Manhua</SelectItem>
                        <SelectItem value="novel">Novel</SelectItem>
                        <SelectItem value="webtoon">Webtoon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status *</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ongoing">Em Andamento</SelectItem>
                        <SelectItem value="completed">Completo</SelectItem>
                        <SelectItem value="hiatus">Hiato</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Sinopse</Label>
                  <Textarea
                    placeholder="Descreva a história..."
                    value={form.synopsis}
                    onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Imagens</h3>
              <div className="space-y-4">
                <div>
                  <Label>Capa *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL ou faça upload"
                      value={form.cover_url}
                      onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                      className="flex-1"
                    />
                    <input
                      type="file"
                      ref={editCoverInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !form.title) {
                          toast({ title: 'Erro', description: 'Preencha o título primeiro', variant: 'destructive' });
                          return;
                        }
                        setCoverUploading(true);
                        const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const ext = file.name.split('.').pop() || 'jpg';
                        const path = `covers/${slug}/cover.${ext}`;
                        const result = await uploadToR2(file, path);
                        setCoverUploading(false);
                        if (result.success) {
                          setForm({ ...form, cover_url: result.url! });
                          toast({ title: 'Upload concluído!' });
                        } else {
                          toast({ title: 'Erro', description: result.error, variant: 'destructive' });
                        }
                        if (editCoverInputRef.current) editCoverInputRef.current.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={coverUploading}
                      onClick={() => editCoverInputRef.current?.click()}
                    >
                      {coverUploading ? <span className="animate-spin">⏳</span> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.cover_url && (
                    <div className="mt-2 w-20 h-28 rounded overflow-hidden bg-secondary">
                      <img src={form.cover_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Banner (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL ou faça upload"
                      value={form.banner_url}
                      onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                      className="flex-1"
                    />
                    <input
                      type="file"
                      ref={editBannerInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !form.title) {
                          toast({ title: 'Erro', description: 'Preencha o título primeiro', variant: 'destructive' });
                          return;
                        }
                        setBannerUploading(true);
                        const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const ext = file.name.split('.').pop() || 'jpg';
                        const path = `banners/${slug}/banner.${ext}`;
                        const result = await uploadToR2(file, path);
                        setBannerUploading(false);
                        if (result.success) {
                          setForm({ ...form, banner_url: result.url! });
                          toast({ title: 'Upload concluído!' });
                        } else {
                          toast({ title: 'Erro', description: result.error, variant: 'destructive' });
                        }
                        if (editBannerInputRef.current) editBannerInputRef.current.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={bannerUploading}
                      onClick={() => editBannerInputRef.current?.click()}
                    >
                      {bannerUploading ? <span className="animate-spin">⏳</span> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.banner_url && (
                    <div className="mt-2 h-20 rounded overflow-hidden bg-secondary">
                      <img src={form.banner_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Informações Adicionais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Autor</Label>
                  <Input
                    placeholder="Nome do autor"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Artista</Label>
                  <Input
                    placeholder="Nome do artista"
                    value={form.artist}
                    onChange={(e) => setForm({ ...form, artist: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setEditingManga(null);
                setForm(initialForm);
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Admin Modal */}
      <Dialog open={isAddAdminModalOpen} onOpenChange={setIsAddAdminModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Email do Usuário</Label>
              <Input
                type="email"
                placeholder="usuario@exemplo.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                O usuário já deve ter uma conta registrada no site.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => {
                setIsAddAdminModalOpen(false);
                setAdminEmail('');
              }}>
                Cancelar
              </Button>
              <Button
                disabled={isAddingAdmin || !adminEmail}
                onClick={async () => {
                  if (!adminEmail) return;

                  setIsAddingAdmin(true);

                  // First find the user by email in profiles (we need to query auth.users but we can't directly)
                  // We'll use an edge function for this
                  const { data, error } = await supabase.functions.invoke('add-admin', {
                    body: { email: adminEmail }
                  });

                  setIsAddingAdmin(false);

                  if (error || data?.error) {
                    toast({
                      title: 'Erro',
                      description: data?.error || error?.message || 'Erro ao adicionar admin',
                      variant: 'destructive'
                    });
                  } else {
                    toast({
                      title: 'Sucesso!',
                      description: `${adminEmail} agora é administrador`
                    });
                    setIsAddAdminModalOpen(false);
                    setAdminEmail('');
                  }
                }}
              >
                {isAddingAdmin ? 'Adicionando...' : 'Adicionar Admin'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PlumaComics Scrape Modal */}
      <Dialog open={isScrapeModalOpen} onOpenChange={(open) => {
        setIsScrapeModalOpen(open);
        if (!open) {
          resetScraper();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Scraper de Mangás
            </DialogTitle>
            <DialogDescription className="sr-only">
              Importe mangás do PlumaComics.cloud para o seu catálogo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Source and Proxy Selection */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] max-w-[250px]">
                <Label>Fonte</Label>
                <Select value={scrapeSource} onValueChange={(v: 'plumacomics' | 'nexustoons' | 'coming_soon') => setScrapeSource(v)} disabled={isScraping}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumacomics">PlumaComics.Cloud</SelectItem>
                    <SelectItem value="nexustoons">NexusToons.Site</SelectItem>
                    <SelectItem value="coming_soon" disabled>Em breve...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px] max-w-[250px]">
                <Label>Proxy API</Label>
                <Select value={selectedProxy} onValueChange={(v: ProxyType) => setSelectedProxy(v)} disabled={isScraping}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione o proxy" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROXY_APIS).map(([key, api]) => (
                      <SelectItem key={key} value={key}>{api.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {scrapeStep === 'source' && (scrapeSource === 'plumacomics' || scrapeSource === 'nexustoons') && (
                <Button
                  onClick={scrapeSource === 'nexustoons' ? fetchNexusMangas : fetchPlumaMangas}
                  disabled={isScraping}
                  className="mt-6 gap-2"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Buscar Mangás
                    </>
                  )}
                </Button>
              )}

              {scrapeStep !== 'source' && (
                <Button variant="outline" onClick={resetScraper} className="mt-6 gap-2">
                  <X className="h-4 w-4" />
                  Recomeçar
                </Button>
              )}
            </div>

            {/* Status */}
            {scrapeStatus && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                {isScraping && <Loader2 className="h-4 w-4 animate-spin" />}
                {scrapeStatus}
              </div>
            )}

            {/* Step: Manga List */}
            {scrapeStep === 'mangas' && plumaMangas.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Mangás Disponíveis ({plumaMangas.length})</h3>
                <p className="text-sm text-muted-foreground">Clique em um mangá para ver os capítulos</p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {plumaMangas.map((manga, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border bg-card p-3 cursor-pointer hover:border-primary/50 transition-all"
                      onClick={() => scrapeSource === 'nexustoons' ? fetchNexusChapters(manga) : fetchPlumaChapters(manga)}
                    >
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-2">
                        {manga.cover && (
                          <img
                            src={manga.cover}
                            alt={manga.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <p className="font-medium text-sm line-clamp-2">{manga.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step: Chapter Selection */}
            {scrapeStep === 'chapters' && selectedPlumaManga && plumaChapters.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {selectedPlumaManga.cover && (
                      <img src={selectedPlumaManga.cover} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{selectedPlumaManga.title}</h3>
                    <p className="text-sm text-muted-foreground">{plumaChapters.length} capítulos disponíveis</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={toggleAllChapters}>
                    {plumaChapters.every(ch => ch.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {plumaChapters.filter(ch => ch.selected).length} selecionados
                  </span>
                </div>

                <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border">
                  {plumaChapters.map((chapter) => (
                    <div
                      key={chapter.number}
                      className={`flex items-center gap-3 p-3 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 ${chapter.selected ? 'bg-primary/5' : ''}`}
                      onClick={() => toggleChapterSelection(chapter.number)}
                    >
                      <input
                        type="checkbox"
                        checked={chapter.selected}
                        onChange={() => { }}
                        className="h-4 w-4"
                      />
                      <span className="font-medium">{chapter.title}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{chapter.date}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={scrapeSelectedChapters}
                  disabled={isScraping || plumaChapters.filter(ch => ch.selected).length === 0}
                  className="gap-2"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extraindo...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Extrair Páginas ({plumaChapters.filter(ch => ch.selected).length} caps)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step: Scraped Pages / Publish */}
            {(scrapeStep === 'pages' || scrapeStep === 'publish') && selectedPlumaManga && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {selectedPlumaManga.cover && (
                      <img src={selectedPlumaManga.cover} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{selectedPlumaManga.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {scrapedChapters.length} capítulo(s) extraído(s)
                    </p>
                  </div>
                </div>

                {scrapedChapters.length === 0 && isScraping && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                <div className="space-y-3">
                  {scrapedChapters.map((chapter) => (
                    <div
                      key={chapter.chapterNumber}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">Capítulo {chapter.chapterNumber}</p>
                          <p className="text-sm text-muted-foreground">{chapter.pages.length} páginas</p>
                        </div>
                        <Button
                          onClick={() => publishChapter(chapter)}
                          disabled={publishingChapter === chapter.chapterNumber}
                          className="gap-2"
                        >
                          {publishingChapter === chapter.chapterNumber ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Publicando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Publicar
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Preview of pages */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {chapter.pages.slice(0, 5).map((page, idx) => (
                          <div key={idx} className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-secondary">
                            <img src={page.url} alt={`Página ${page.index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {chapter.pages.length > 5 && (
                          <div className="w-16 h-24 flex-shrink-0 rounded bg-secondary flex items-center justify-center text-sm text-muted-foreground">
                            +{chapter.pages.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {scrapedChapters.length > 0 && (
                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button
                      onClick={async () => {
                        // Copy array to avoid mutation issues during iteration
                        const chaptersToPublish = [...scrapedChapters];
                        for (const ch of chaptersToPublish) {
                          await publishChapter(ch);
                        }
                      }}
                      disabled={publishingChapter !== null}
                      variant="default"
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Publicar Todos ({scrapedChapters.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
