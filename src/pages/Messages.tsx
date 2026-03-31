import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  other_user?: { display_name: string | null; avatar_url: string | null; user_id: string };
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

// Conversations list
const ConversationsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convs || convs.length === 0) { setConversations([]); setLoading(false); return; }

    const otherUserIds = convs.map((c) => c.user1_id === user.id ? c.user2_id : c.user1_id);
    const convIds = convs.map((c) => c.id);

    const [{ data: profiles }, { data: lastMessages }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", otherUserIds),
      supabase.from("messages").select("conversation_id, content, read, sender_id, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false }),
    ]);

    const profileMap: Record<string, any> = {};
    profiles?.forEach((p) => { profileMap[p.user_id] = p; });

    const enriched = convs.map((c) => {
      const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
      const convMessages = lastMessages?.filter((m) => m.conversation_id === c.id) || [];
      const unread = convMessages.filter((m) => m.sender_id !== user.id && !m.read).length;
      return {
        ...c,
        other_user: profileMap[otherId] ? { ...profileMap[otherId] } : { display_name: "Anônimo", avatar_url: null, user_id: otherId },
        last_message: convMessages[0]?.content || "",
        unread_count: unread,
      };
    });

    setConversations(enriched);
    setLoading(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-orange-400" /> Mensagens
        </h1>

        {loading ? (
          <p className="text-center text-white/30 py-12">Carregando...</p>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Nenhuma conversa ainda</p>
            <p className="text-white/20 text-xs mt-1">Visite o perfil de alguém e clique em "Mensagem"</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/mensagens/${conv.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {conv.other_user?.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-orange-400">{getInitials(conv.other_user?.display_name || null)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold truncate ${conv.unread_count ? "text-white" : "text-white/70"}`}>
                      {conv.other_user?.display_name || "Anônimo"}
                    </p>
                    <span className="text-xs text-white/30 shrink-0 ml-2">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs truncate ${conv.unread_count ? "text-white/60" : "text-white/30"}`}>
                      {conv.last_message || "Nenhuma mensagem"}
                    </p>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="w-5 h-5 bg-orange-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Chat view
const ChatView = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !conversationId) return;
    loadChat();
    markAsRead();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => [...prev, msg]);
        if (msg.sender_id !== user.id) markAsRead();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChat = async () => {
    if (!conversationId || !user) return;

    const [{ data: conv }, { data: msgs }] = await Promise.all([
      supabase.from("conversations").select("*").eq("id", conversationId).single(),
      supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    ]);

    if (conv) {
      const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
      const { data: profile } = await supabase.from("profiles").select("user_id, display_name, avatar_url").eq("user_id", otherId).single();
      setOtherUser(profile);
    }

    if (msgs) setMessages(msgs);
  };

  const markAsRead = async () => {
    if (!conversationId || !user) return;
    await supabase
      .from("messages")
      .update({ read: true } as any)
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("read", false);
  };

  const handleSend = async () => {
    if (!user || !conversationId || !newMessage.trim()) return;
    setSending(true);

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim(),
    } as any);

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() } as any)
      .eq("id", conversationId);

    setNewMessage("");
    setSending(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* Chat header */}
      <div className="sticky top-0 z-50 bg-[#16162a]/90 backdrop-blur border-b border-white/5 px-4 h-16 flex items-center gap-3">
        <button onClick={() => navigate("/mensagens")} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => otherUser && navigate(`/usuario/${otherUser.user_id}`)}
        >
          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
            {otherUser?.avatar_url ? (
              <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-orange-400">{getInitials(otherUser?.display_name)}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-white">{otherUser?.display_name || "Carregando..."}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                isMine
                  ? "bg-orange-500 text-white rounded-br-md"
                  : "bg-white/10 text-white/90 rounded-bl-md"
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-white/30"}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#16162a] border-t border-white/5 p-3">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-400/30"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export { ConversationsList, ChatView };
