import { ExternalLink, MessageCircle, Users, Gamepad2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const Discord = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'Chat em Tempo Real',
      description: 'Converse com outros leitores sobre suas obras favoritas',
    },
    {
      icon: Users,
      title: 'Comunidade Ativa',
      description: 'Faça parte de uma comunidade de milhares de fãs',
    },
    {
      icon: Gamepad2,
      title: 'Eventos Exclusivos',
      description: 'Participe de sorteios, quizzes e muito mais',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="w-20 h-20 rounded-full bg-[#5865F2] flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Junte-se ao nosso Discord
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Faça parte da nossa comunidade no Discord! Converse com outros leitores, 
              receba notificações de novos capítulos e participe de eventos exclusivos.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card p-6 text-center"
              >
                <feature.icon className="h-10 w-10 mx-auto mb-4 text-[#5865F2]" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            variant="default"
            size="xl"
            className="bg-[#5865F2] hover:bg-[#4752C4] gap-2"
            onClick={() => window.open('https://discord.gg/', '_blank')}
          >
            <ExternalLink className="h-5 w-5" />
            Entrar no Discord
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            +5.000 membros ativos
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Discord;
