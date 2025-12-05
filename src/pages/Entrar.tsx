import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Entrar = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsSubmitting(false);
    
    if (error) {
      toast({ title: "Erro", description: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Login realizado com sucesso" });
      navigate('/');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.name || !registerData.email || !registerData.password) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (registerData.password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await signUp(registerData.email, registerData.password, registerData.name);
    setIsSubmitting(false);
    
    if (error) {
      const message = error.message === 'User already registered' ? 'Este email já está cadastrado' : error.message;
      toast({ title: "Erro", description: message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Conta criada com sucesso" });
      navigate('/');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="h-8 w-8" />
          <span className="text-2xl font-display font-bold">HavenComics</span>
        </Link>

        <div className="flex rounded-lg bg-secondary p-1 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-md transition-all",
              activeTab === 'login' ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Entrar
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-md transition-all",
              activeTab === 'register' ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Registrar
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Entrar</h2>
                <p className="text-sm text-muted-foreground">Entre com seu email para acessar sua conta</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-9"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Criar conta</h2>
                <p className="text-sm text-muted-foreground">Preencha os dados para criar sua conta</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      className="pl-9"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-9"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar conta'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">← Voltar para o início</Link>
        </p>
      </div>
    </div>
  );
};

export default Entrar;
