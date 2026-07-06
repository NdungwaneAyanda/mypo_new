import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X } from "lucide-react";

interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
}

interface ApplicationChatProps {
  applicationId: string;
  appEmail: string;
  assignedFunderId: string | null;
  onClose: () => void;
}

const ApplicationChat = ({ applicationId, appEmail, assignedFunderId, onClose }: ApplicationChatProps) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Resolve the receiver's user ID using secure DB function
  useEffect(() => {
    const resolve = async () => {
      if (!user) return;

      const { data, error } = await supabase.rpc("resolve_chat_recipient", {
        _application_id: applicationId,
        _current_user_id: user.id,
      });

      if (!error && data) {
        setReceiverId(data as string);
      } else {
        console.error("Failed to resolve chat recipient:", error);
      }
    };
    resolve();
  }, [user, applicationId]);

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("application_messages")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as unknown as Message[]);
      }
      setLoading(false);
    };
    fetchMessages();
  }, [applicationId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${applicationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "application_messages",
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          const newMsg = payload.new as unknown as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !receiverId) return;
    setSending(true);

    const { error } = await supabase.from("application_messages").insert({
      application_id: applicationId,
      sender_id: user.id,
      receiver_id: receiverId,
      message_text: newMessage.trim(),
    } as any);

    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-2 border-[#d1d5db] rounded-xl bg-card overflow-hidden mt-4">
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#d1d5db] bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground">Messages</h4>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-64 px-4 py-3">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-[10px] font-medium opacity-70 mb-0.5">
                      {isOwn ? "You" : profile?.role === "funder" ? "Supplier" : "Funder"}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.message_text}</p>
                    <p className="text-[10px] opacity-50 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="flex items-center gap-2 px-4 py-3 border-t-2 border-[#d1d5db]">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={receiverId ? "Type a message..." : "Resolving recipient..."}
          className="flex-1"
          disabled={sending || !receiverId}
        />
        <Button size="sm" onClick={handleSend} disabled={sending || !newMessage.trim() || !receiverId}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ApplicationChat;
