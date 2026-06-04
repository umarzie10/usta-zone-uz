import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Send, Loader2, Users, UserCheck, Megaphone } from 'lucide-react';

const AUDIENCES = [
  { id: 'all', label: 'Hammaga', icon: Megaphone },
  { id: 'clients', label: 'Mijozlar', icon: Users },
  { id: 'masters', label: 'Ustalar', icon: UserCheck },
];

export default function AdminBroadcast() {
  const { showNotification } = useApp();
  const [audience, setAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(20);
    setHistory(data || []);
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!title.trim() || !message.trim()) { showNotification('error', 'Sarlavha va matn majburiy'); return; }
    setSending(true);
    const { data, error } = await supabase.rpc('admin_send_broadcast', {
      _audience: audience, _title: title, _message: message, _send_sms: false,
    });
    setSending(false);
    if (error) { showNotification('error', error.message); return; }
    showNotification('success', `${(data as any)?.count || 0} foydalanuvchiga yuborildi`);
    setTitle(''); setMessage(''); load();
  };

  return (
    <div className="space-y-6">
      <div className="card-premium p-6 space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />Yangi xabar yuborish</h3>

        <div>
          <Label className="text-sm mb-2 block">Auditoriya</Label>
          <div className="grid grid-cols-3 gap-2">
            {AUDIENCES.map(a => (
              <button key={a.id} onClick={() => setAudience(a.id)}
                className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-1.5 ${audience === a.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <a.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm">Sarlavha</Label>
          <Input className="rounded-xl mt-1.5" value={title} onChange={e => setTitle(e.target.value)} placeholder="Masalan: Yangilanish" />
        </div>

        <div>
          <Label className="text-sm">Matn</Label>
          <Textarea className="rounded-xl mt-1.5" rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Xabar matni..." />
        </div>

        <Button className="w-full rounded-xl btn-hero" disabled={sending} onClick={send}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Yuborish
        </Button>
      </div>

      <div>
        <h4 className="font-bold mb-3 text-sm">Tarix</h4>
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Hozircha yuborilgan xabarlar yo'q</p>
          ) : history.map(b => (
            <div key={b.id} className="card-premium p-4 row-interactive">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{b.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-primary">{b.recipients_count} 👥</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleDateString('uz-UZ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
