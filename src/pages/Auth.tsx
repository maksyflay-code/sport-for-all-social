import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCidadelas from "@/assets/logo-cidadelas.jpeg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) toast.error("Erro ao entrar com Google");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col lg:flex-row items-center gap-10 max-w-[980px] w-full">
        {/* Left - branding */}
        <div className="lg:flex-1 text-center lg:text-left lg:pr-8">
          <div className="flex items-center gap-3 justify-center lg:justify-start mb-4">
            <img src={logoCidadelas} alt="Cidadelas 360" className="w-14 h-14 rounded-full object-cover" />
            <h1 className="text-[42px] font-bold text-primary leading-none">cidadelas 360</h1>
          </div>
          <p className="text-xl text-foreground/80 max-w-md">
            Conecte-se com comunidades esportivas inclusivas. Compartilhe histórias e celebre cada vitória.
          </p>
        </div>

        {/* Right - form */}
        <div className="w-full max-w-[396px]">
          <div className="bg-card rounded-lg shadow-elevated p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome completo"
                  required={!isLogin}
                  className="h-[52px] text-[17px] rounded-md border-border"
                />
              )}
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email ou telefone"
                required
                className="h-[52px] text-[17px] rounded-md border-border"
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                required
                minLength={6}
                className="h-[52px] text-[17px] rounded-md border-border"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] text-xl font-bold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Cadastre-se"}
              </Button>
            </form>

            {isLogin && (
              <div className="text-center mt-3">
                <a href="#" className="text-sm text-primary hover:underline">Esqueceu a senha?</a>
              </div>
            )}

            <div className="border-t border-border my-4" />

            <div className="space-y-3">
              <Button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full h-[48px] text-[17px] font-bold rounded-md bg-success text-success-foreground hover:bg-success/90"
              >
                {isLogin ? "Criar nova conta" : "Já tenho uma conta"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full h-[44px] font-semibold rounded-md"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Entrar com Google
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Inclusão no esporte para todos. 🏅
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
