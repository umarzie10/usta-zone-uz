import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ChatDialog from '@/components/ChatDialog';
import { Bell, MessageCircle, ShoppingBag, Star, Check, Reply } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  sender_id: string | null;
  sender_name?: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { t } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ id: string; name: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) {
        const senderIds = [...new Set(data.filter(n => n.sender_id).map(n => n.sender_id!))];
        let nameMap = new Map<string, string>();
        if (senderIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', senderIds);
          nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        }
        setNotifications(data.map(n => ({ ...n, sender_name: n.sender_id ? nameMap.get(n.sender_id) || 'Foydalanuvchi' : undefined })) as Notification[]);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        const n = payload.new as Notification;
        if (n.sender_id) {
          const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', n.sender_id).maybeSingle();
          n.sender_name = p?.full_name || 'Foydalanuvchi';
        }
        setNotifications(prev => [n, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close dropdown when clicking outside, but NOT when ChatDialog is open
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (chatTarget) return; // Don't close if chat is open
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [chatTarget]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleReply = useCallback((n: Notification) => {
    if (n.sender_id) {
      setChatTarget({ id: n.sender_id, name: n.sender_name || 'Foydalanuvchi' });
      setOpen(false);
    }
  }, []);

  const getIcon = (type: string) => {
    if (type === 'new_message') return <MessageCircle className="h-4 w-4 text-primary" />;
    if (type === 'new_order') return <ShoppingBag className="h-4 w-4 text-amber-500" />;
    if (type === 'new_review') return <Star className="h-4 w-4 text-amber-400" />;
    return <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <>
      <div className="relative" ref={ref}>
        <Button variant="ghost" size="icon" className="rounded-lg relative" onClick={() => setOpen(!open)}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center font-bold px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="font-bold text-sm">Bildirishnomalar</h4>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Check className="h-3 w-3" /> Barchasini o'qish
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  Bildirishnomalar yo'q
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 ${!n.is_read ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {n.sender_id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReply(n); }}
                              className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-medium"
                            >
                              <Reply className="h-3 w-3" /> Javob
                            </button>
                          )}
                        </div>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {chatTarget && createPortal(
        <ChatDialog
          receiverId={chatTarget.id}
          receiverName={chatTarget.name}
          open={true}
          onClose={() => setChatTarget(null)}
        />,
        document.body
      )}
    </>
  );
}
