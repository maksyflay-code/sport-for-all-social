import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  userId: string;
  type: "followers" | "following";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserItem {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const FollowersModal = ({ userId, type, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadUsers();
  }, [open, userId, type]);

  const loadUsers = async () => {
    setLoading(true);
    const column = type === "followers" ? "following_id" : "follower_id";
    const selectColumn = type === "followers" ? "follower_id" : "following_id";

    const { data: follows } = await supabase
      .from("follows")
      .select(selectColumn)
      .eq(column, userId);

    if (!follows || follows.length === 0) { setUsers([]); setLoading(false); return; }

    const ids = follows.map((f: any) => f[selectColumn]);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", ids);

    setUsers(profiles || []);
    setLoading(false);
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) { toast.error("Faça login primeiro"); return; }
    const { data } = await supabase.rpc("get_or_create_conversation", { other_user_id: otherUserId });
    if (data) {
      onOpenChange(false);
      navigate(`/mensagens/${data}`);
    } else {
      toast.error("Erro ao iniciar conversa");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e1e3a] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">
            {type === "followers" ? "Seguidores" : "Seguindo"}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {loading ? (
            <p className="text-sm text-white/30 text-center py-8">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">
              {type === "followers" ? "Nenhum seguidor ainda" : "Não segue ninguém ainda"}
            </p>
          ) : (
            users.map((u) => (
              <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <button
                  onClick={() => { onOpenChange(false); navigate(`/usuario/${u.user_id}`); }}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-orange-400">
                        {u.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{u.display_name || "Anônimo"}</p>
                </button>
                {user && u.user_id !== user.id && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 rounded-xl text-white/50 hover:text-orange-400 hover:bg-white/10 w-9 h-9"
                    onClick={() => startConversation(u.user_id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal;
