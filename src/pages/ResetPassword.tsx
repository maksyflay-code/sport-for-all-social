import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logoCidadelas from "@/assets/logo.jpeg";
import heroImage from "@/assets/hero-sports.jpg";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar senha");
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
        <div className="text-center mb-8">
          <img src={logoCidadelas} alt="Cidadelas 360" className="w-16 h-16 rounded-full object-cover mx-auto mb-4 shadow-lg" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            CIDADELAS <span className="text-orange-400">360</span>
          </h1>
        </div>

        <div className="bg-white/5 rounded-2xl shadow-lg p-6 border border-white/10 backdrop-blur-sm">
          {ready ? (
            <form onSubmit={handleReset} className="space-y-3">
              <h2 className="text-white text-lg font-semibold text-center mb-2">Nova senha</h2>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nova senha"
                required
                minLength={6}
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus-visible:ring-orange-400/50"
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova senha"
                required
                minLength={6}
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus-visible:ring-orange-400/50"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm"
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          ) : (
            <div className="text-center text-white/60 text-sm py-4">
              <p>Link inválido ou expirado.</p>
              <button
                onClick={() => navigate("/auth")}
                className="text-orange-400 hover:underline mt-2 inline-block"
              >
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
