import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AdminComplaints() {
  const { showNotification } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: string, status: 'resolved' | 'rejected') => {
    const { error } = await supabase.from('complaints').update({
      status, admin_note: note || null, resolved_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { showNotification('error', error.message); return; }
    showNotification('success', 'Yangilandi');
    setNoteFor(null); setNote(''); load();
  };

  const visible = items.filter(i =>
    filter === 'all' ? true : filter === 'open' ? i.status === 'open' : i.status !== 'open'
  );

  const badge = (status: string) => {
    if (status === 'open') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold"><Clock className="h-3 w-3" />Ochiq</span>;
    if (status === 'resolved') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold"><CheckCircle2 className="h-3 w-3" />Hal qilindi</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold"><XCircle className="h-3 w-3" />Rad etildi</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['open', 'resolved', 'all'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="rounded-xl" onClick={() => setFilter(f)}>
            {f === 'open' ? 'Ochiq' : f === 'resolved' ? 'Yopilgan' : 'Hammasi'}
          </Button>
        ))}
      </div>

      {loading ? <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> :
        visible.length === 0 ? (
          <div className="card-premium p-10 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Shikoyatlar yo'q</p>
          </div>
        ) : visible.map(c => (
          <div key={c.id} className="card-premium p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase text-primary">{c.category}</span>
                  {badge(c.status)}
                </div>
                <p className="text-sm">{c.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {new Date(c.created_at).toLocaleString('uz-UZ')}
                </p>
              </div>
            </div>

            {c.admin_note && c.status !== 'open' && (
              <div className="text-xs p-2 rounded-lg bg-muted/50 border border-border">
                <span className="font-bold">Admin: </span>{c.admin_note}
              </div>
            )}

            {c.status === 'open' && (
              noteFor === c.id ? (
                <div className="space-y-2">
                  <Textarea placeholder="Admin izohi (ixtiyoriy)" rows={2} value={note} onChange={e => setNote(e.target.value)} className="rounded-xl text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl flex-1" onClick={() => resolve(c.id, 'resolved')}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Hal qilish
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl flex-1" onClick={() => resolve(c.id, 'rejected')}>
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />Rad etish
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => { setNoteFor(null); setNote(''); }}>Bekor</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setNoteFor(c.id)}>
                  Ko'rib chiqish
                </Button>
              )
            )}
          </div>
        ))
      }
    </div>
  );
}
