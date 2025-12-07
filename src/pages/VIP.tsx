import { useState } from 'react';
import { Crown, Zap, Heart, TrendingUp, Gift, Check, ChevronDown, ChevronUp, Ticket } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
  premium?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Para leitores casuais',
    icon: Crown,
    features: [
      'Acesso a catálogo básico',
      'Capítulos ilimitados',
      'Anúncios',
      'Resolução padrão',
    ],
  },
  {
    id: 'silver',
    name: 'VIP Silver',
    price: 9.90,
    description: 'Para leitores regulares',
    icon: Zap,
    popular: true,
    features: [
      'Tudo do Free',
      'Capítulos ilimitados',
      'Sem anúncios',
      'Resolução HD',
      'Acesso antecipado (24h)',
    ],
  },
  {
    id: 'gold',
    name: 'VIP Gold',
    price: 19.90,
    description: 'Para verdadeiros fãs',
    icon: Gift,
    premium: true,
    features: [
      'Tudo do Silver',
      'Acesso antecipado (72h)',
      'Conteúdo exclusivo VIP',
      'Download para leitura offline',
      'Resolução 4K',
      'Suporte prioritário',
    ],
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Acesso Antecipado',
    description: 'Leia os novos capítulos antes de todos os outros',
  },
  {
    icon: Heart,
    title: 'Sem Anúncios',
    description: 'Experiência de leitura limpa e sem interrupções',
  },
  {
    icon: TrendingUp,
    title: 'Qualidade Superior',
    description: 'Imagens em alta resolução para melhor experiência',
  },
  {
    icon: Gift,
    title: 'Conteúdo Exclusivo',
    description: 'Acesso a obras e capítulos exclusivos para VIPs',
  },
];

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento sem custos adicionais. Você continuará tendo acesso aos benefícios até o fim do período pago.',
  },
  {
    question: 'Como funciona o acesso antecipado?',
    answer: 'Membros Silver recebem acesso 24 horas antes, e membros Gold recebem 72 horas antes dos novos capítulos serem liberados publicamente.',
  },
  {
    question: 'Posso fazer upgrade do meu plano?',
    answer: 'Sim! Você pode fazer upgrade a qualquer momento. O valor proporcional do plano anterior será creditado no novo plano.',
  },
  {
    question: 'Quais são os métodos de pagamento aceitos?',
    answer: 'Aceitamos cartões de crédito, PIX, boleto bancário e carteiras digitais. Todos os pagamentos são processados de forma segura.',
  },
];

const VIP = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [vipCode, setVipCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { user } = useAuth();

  const handleRedeemCode = async () => {
    if (!vipCode.trim()) {
      toast({ title: 'Erro', description: 'Digite um código', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Erro', description: 'Faça login para resgatar seu código', variant: 'destructive' });
      return;
    }

    setIsRedeeming(true);

    // Check if code exists and is not used
    const { data: codeData, error: codeError } = await supabase
      .from('vip_codes')
      .select('*')
      .eq('code', vipCode.trim().toUpperCase())
      .eq('is_used', false)
      .single();

    if (codeError || !codeData) {
      setIsRedeeming(false);
      toast({ title: 'Erro', description: 'Código inválido ou já utilizado', variant: 'destructive' });
      return;
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + codeData.duration_days);

    // Update user profile with VIP tier
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        vip_tier: codeData.tier,
        vip_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      setIsRedeeming(false);
      toast({ title: 'Erro', description: 'Erro ao ativar VIP', variant: 'destructive' });
      return;
    }

    // Mark code as used
    await supabase
      .from('vip_codes')
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', codeData.id);

    setIsRedeeming(false);
    setVipCode('');
    toast({
      title: 'Sucesso!',
      description: `VIP ${codeData.tier.charAt(0).toUpperCase() + codeData.tier.slice(1)} ativado por ${codeData.duration_days} dias!`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="py-16 text-center">
          <div className="container">
            <Badge variant="warning" className="mb-4">
              <Crown className="h-3 w-3 mr-1" />
              Planos VIP
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Eleve sua Experiência de Leitura
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Desfrute de benefícios exclusivos, acesso antecipado e suporte prioritário com nossos planos VIP
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border bg-card p-6 transition-all duration-300 hover:scale-[1.02]",
                    plan.popular && "border-primary shadow-lg shadow-primary/20",
                    plan.premium && "border-warning"
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                      Mais Popular
                    </Badge>
                  )}
                  {plan.premium && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="warning">
                      Premium
                    </Badge>
                  )}

                  <div className="text-center mb-6">
                    <plan.icon className={cn(
                      "h-10 w-10 mx-auto mb-3",
                      plan.popular && "text-foreground",
                      plan.premium && "text-warning"
                    )} />
                    <h3 className="text-xl font-display font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Redeem Code Section */}
        <section className="py-12 bg-card/50">
          <div className="container max-w-xl">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <Ticket className="h-10 w-10 mx-auto mb-4 text-warning" />
              <h2 className="text-xl font-display font-bold mb-2">Já tem seu código?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Insira seu código VIP abaixo para ativar sua assinatura
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite seu código"
                  value={vipCode}
                  onChange={(e) => setVipCode(e.target.value.toUpperCase())}
                  className="text-center uppercase"
                />
                <Button onClick={handleRedeemCode} disabled={isRedeeming}>
                  {isRedeeming ? 'Ativando...' : 'Ativar'}
                </Button>
              </div>
              {!user && (
                <p className="text-xs text-muted-foreground mt-3">
                  <Link to="/entrar" className="underline">Faça login</Link> para resgatar seu código
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
              Por que ser VIP?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card p-6 text-center transition-all duration-300 hover:border-border"
                >
                  <benefit.icon className="h-8 w-8 mx-auto mb-4 text-foreground" />
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-card/50">
          <div className="container max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
              Perguntas Frequentes
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-secondary/50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {openFAQ === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  {openFAQ === index && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground mb-6">
              Escolha seu plano e aproveite todos os benefícios VIP hoje mesmo
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button variant="default" size="lg">
                Começar Agora
              </Button>
              <Link to="/catalogo">
                <Button variant="outline" size="lg">
                  Explorar Catálogo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VIP;
