import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  text_color: string;
  created_at: string;
  profile?: {
    username: string | null;
    vip_tier: string | null;
  };
  roles?: string[];
}

interface CommentsProps {
  mangaId: string;
  chapterNumber?: number;
}

const VIP_COLORS = [
  { name: 'Branco', value: '#ffffff' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Ciano', value: '#06b6d4' },
];

const TIER_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'warning' }> = {
  free: { label: 'Free', variant: 'secondary' },
  silver: { label: 'Silver', variant: 'default' },
  gold: { label: 'Gold', variant: 'warning' },
};

const Comments = ({ mangaId, chapterNumber }: CommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [userTier, setUserTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
    if (user) {
      fetchUserTier();
    }
  }, [mangaId, chapterNumber, user]);

  const fetchComments = async () => {
    try {
      let query = supabase
        .from('comments')
        .select('*')
        .eq('manga_id', mangaId)
        .order('created_at', { ascending: false });

      if (chapterNumber !== undefined) {
        query = query.eq('chapter_number', chapterNumber);
      } else {
        query = query.is('chapter_number', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles and roles for each comment
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        
        const [profilesResult, rolesResult] = await Promise.all([
          supabase.from('profiles').select('id, username, vip_tier').in('id', userIds),
          supabase.from('user_roles').select('user_id, role').in('user_id', userIds)
        ]);

        const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]));
        const rolesMap = new Map<string, string[]>();
        rolesResult.data?.forEach(r => {
          const existing = rolesMap.get(r.user_id) || [];
          rolesMap.set(r.user_id, [...existing, r.role]);
        });
        
        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profile: profileMap.get(comment.user_id) || null,
          roles: rolesMap.get(comment.user_id) || [],
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTier = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('vip_tier')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setUserTier(data.vip_tier || 'free');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para comentar.',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        manga_id: mangaId,
        chapter_number: chapterNumber || null,
        content: newComment.trim(),
        text_color: userTier !== 'free' ? selectedColor : '#ffffff',
      });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast({
        title: 'Comentário enviado!',
        description: 'Seu comentário foi publicado com sucesso.',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({
        title: 'Comentário excluído',
        description: 'Seu comentário foi removido.',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const isVip = userTier !== 'free';

  return (
    <div className="bg-card rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comentários {chapterNumber ? `- Capítulo ${chapterNumber}` : ''}
        </h3>
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </div>

      {/* Comment Form */}
      {user ? (
        <div className="mb-6 space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva seu comentário..."
            className="min-h-[100px] resize-none"
            style={isVip ? { color: selectedColor } : undefined}
          />
          
          {/* VIP Color Selector */}
          {isVip && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Cor do texto:</span>
              {VIP_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    selectedColor === color.value ? 'scale-125 border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-secondary/50 rounded-lg text-center">
          <p className="text-muted-foreground">
            <a href="/entrar" className="text-primary hover:underline">Faça login</a> para comentar.
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando comentários...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum comentário ainda. Seja o primeiro!
          </div>
        ) : (
          comments.map((comment) => {
            const tier = comment.profile?.vip_tier || 'free';
            const badge = TIER_BADGES[tier] || TIER_BADGES.free;
            const roles = comment.roles || [];
            const isDono = roles.includes('dono');
            const isAdmin = roles.includes('admin');
            const isVipUser = tier !== 'free';

            return (
              <div key={comment.id} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {comment.profile?.username || 'Usuário'}
                    </span>
                    {isDono && (
                      <Badge className="text-xs gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0">
                        <Crown className="h-3 w-3" /> Dono
                      </Badge>
                    )}
                    {isAdmin && !isDono && (
                      <Badge variant="destructive" className="text-xs">Admin</Badge>
                    )}
                    {isVipUser && (
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {user?.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <p style={{ color: comment.text_color }}>{comment.content}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Comments;