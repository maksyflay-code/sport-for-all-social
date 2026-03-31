import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCidadelas from "@/assets/logo.jpeg";
import heroImage from "@/assets/hero-sports.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://cidadelas360.com.br/reset-password`,
      });
      if (error) throw error;
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgot(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#1a1a2e]/85 backdrop-blur-sm" />
      </div>
      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoCidadelas} alt="Cidadelas 360" className="w-16 h-16 rounded-full object-cover mx-auto mb-4 shadow-lg" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            CIDADELAS <span className="text-orange-400">360</span>
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Inclusão no esporte para todos
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl shadow-lg p-6 border border-white/10 backdrop-blur-sm">
          {isForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <h2 className="text-white text-lg font-semibold text-center mb-2">Recuperar senha</h2>
              <p className="text-white/50 text-xs text-center mb-2">Digite seu email para receber o link de recuperação</p>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus-visible:ring-orange-400/50"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm"
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <div className="text-center mt-2">
                <button type="button" onClick={() => setIsForgot(false)} className="text-sm text-orange-400 hover:underline">
                  Voltar ao login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                {!isLogin && (
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome completo"
                    required={!isLogin}
                    className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus-visible:ring-orange-400/50"
                  />
                )}
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus-visible:ring-orange-400/50"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  required
                  minLength={6}
                  className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus-visible:ring-orange-400/50"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm"
                >
                  {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
                </Button>
              </form>

              {isLogin && (
                <div className="text-center mt-3">
                  <button type="button" onClick={() => setIsForgot(true)} className="text-xs text-orange-400 hover:underline">
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-orange-400 font-medium hover:underline"
                >
                  {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
