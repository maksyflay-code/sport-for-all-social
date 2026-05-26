import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hora
const IDLE_STORAGE_KEY = "last_activity_at";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session) {
          localStorage.setItem(IDLE_STORAGE_KEY, Date.now().toString());
        } else {
          localStorage.removeItem(IDLE_STORAGE_KEY);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const last = parseInt(localStorage.getItem(IDLE_STORAGE_KEY) || "0", 10);
        if (last && Date.now() - last > IDLE_TIMEOUT_MS) {
          supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        localStorage.setItem(IDLE_STORAGE_KEY, Date.now().toString());
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Idle tracking: marca atividade e desloga após 1h sem interação
  useEffect(() => {
    if (!session) return;

    let timer: ReturnType<typeof setTimeout>;

    const logoutForIdle = async () => {
      await supabase.auth.signOut();
    };

    const markActivity = () => {
      localStorage.setItem(IDLE_STORAGE_KEY, Date.now().toString());
      clearTimeout(timer);
      timer = setTimeout(logoutForIdle, IDLE_TIMEOUT_MS);
    };

    const checkOnVisibility = () => {
      if (document.visibilityState === "visible") {
        const last = parseInt(localStorage.getItem(IDLE_STORAGE_KEY) || "0", 10);
        if (last && Date.now() - last > IDLE_TIMEOUT_MS) {
          logoutForIdle();
        } else {
          markActivity();
        }
      }
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, markActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", checkOnVisibility);
    markActivity();

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, markActivity));
      document.removeEventListener("visibilitychange", checkOnVisibility);
    };
  }, [session]);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(IDLE_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
