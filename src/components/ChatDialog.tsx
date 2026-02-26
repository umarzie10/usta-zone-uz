import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  order_id: string | null;
}

interface ChatDialogProps {
  receiverId: string;
  receiverName: string;
  orderId?: string;
  open: boolean;
  onClose: () => void;
}

export default function ChatDialog({ receiverId, receiverName, orderId, open, onClose }: ChatDialogProps) {
  const { t } = useApp();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data as Message[]);
      setLoading(false);

      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', receiverId)
        .eq('is_read', false);
    };

    fetchMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`chat-${user.id}-${receiverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === receiverId) {
            setMessages(prev => [...prev, msg]);
            // Mark as read
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {});
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.receiver_id === receiverId) {
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, user, receiverId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: newMessage.trim(),
        order_id: orderId || null,
      });
      if (!error) {
        const msgText = newMessage.trim();
        setNewMessage('');
        
        // Send SMS notification to receiver
        try {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          if (projectId) {
            // Get receiver's phone
            const { data: receiverProfile } = await supabase
              .from('profiles')
              .select('phone, full_name')
              .eq('user_id', receiverId)
              .single();
            
            if (receiverProfile?.phone) {
              const senderName = (await supabase.from('profiles').select('full_name').eq('user_id', user.id).single()).data?.full_name || 'Foydalanuvchi';
              await supabase.functions.invoke('send-sms', {
                body: {
                  phone: receiverProfile.phone,
                  message: `UstaZone: ${senderName} sizga xabar yubordi: "${msgText.substring(0, 100)}"`,
                  type: 'new_message',
                },
              });
            }
          }
        } catch (smsErr) {
          console.log('SMS notification skipped:', smsErr);
        }
      }
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="card-premium p-8 text-center max-w-sm w-full">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">{t('loginToChat')}</p>
          <Button className="mt-4 rounded-xl" onClick={onClose}>{t('back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg h-[80vh] sm:h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{receiverName}</p>
              <p className="text-xs text-muted-foreground">{t('chat')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {t('noMessages')}
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={t('typeMessage')}
              className="rounded-xl h-11"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="rounded-xl h-11 px-4 btn-hero"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
