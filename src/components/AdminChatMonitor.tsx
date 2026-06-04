import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminChatMonitor() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_recent_messages', { _limit: 200 });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(m =>
    !q || (m.content || '').toLowerCase().includes(q.toLowerCase()) ||
    (m.sender_name || '').toLowerCase().includes(q.toLowerCase()) ||
    (m.receiver_name || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 rounded-xl h-11" placeholder="Xabar yoki foydalanuvchi qidirish..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Button variant="outline" className="rounded-xl h-11" onClick={load}>Yangilash</Button>
      </div>

      {loading ? <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> :
        filtered.length === 0 ? (
          <div className="card-premium p-10 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Xabarlar topilmadi</p>
          </div>
        ) : (
          <div className="card-premium overflow-hidden">
            {filtered.map((m, idx) => (
              <div key={m.id} className={`row-interactive p-4 ${idx > 0 ? 'border-t border-border' : ''}`}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <p className="font-bold">
                    {m.sender_name || '—'} <span className="text-muted-foreground">→</span> {m.receiver_name || '—'}
                  </p>
                  <span className="text-muted-foreground">{new Date(m.created_at).toLocaleString('uz-UZ')}</span>
                </div>
                <p className="text-sm">{m.content}</p>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
