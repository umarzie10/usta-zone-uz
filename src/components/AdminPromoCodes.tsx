import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Plus, Loader2, Trash2, Power } from 'lucide-react';

export default function AdminPromoCodes() {
  const { showNotification } = useApp();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percent', discount_value: '', max_uses: '', min_order_amount: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  const create = async () => {
    if (!form.code || !form.discount_value) { showNotification('error', "Kod va chegirma kiriting"); return; }
    setCreating(true);
    try {
      const { error } = await supabase.from('promo_codes').insert({
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
      });
      if (error) throw error;
      showNotification('success', 'Promo kod yaratildi');
      setForm({ code: '', discount_type: 'percent', discount_value: '', max_uses: '', min_order_amount: '' });
      load();
    } catch (err: any) { showNotification('error', err.message); } finally { setCreating(false); }
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from('promo_codes').update({ is_active: !active }).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await supabase.from('promo_codes').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="card-premium p-5 space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Yangi promo kod</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-xs">Kod</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="rounded-xl mt-1 font-mono uppercase" placeholder="WELCOME10" /></div>
          <div><Label className="text-xs">Turi</Label>
            <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })} className="w-full mt-1 h-10 px-3 rounded-xl border border-input bg-background text-sm">
              <option value="percent">Foiz (%)</option><option value="fixed">Belgilangan summa (so'm)</option>
            </select>
          </div>
          <div><Label className="text-xs">Chegirma qiymati</Label><Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} className="rounded-xl mt-1" placeholder="10" /></div>
          <div><Label className="text-xs">Maks. ishlatish (bo'sh = cheksiz)</Label><Input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} className="rounded-xl mt-1" placeholder="100" /></div>
          <div className="sm:col-span-2"><Label className="text-xs">Min. order summasi (so'm)</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} className="rounded-xl mt-1" placeholder="0" /></div>
        </div>
        <Button onClick={create} disabled={creating} className="w-full rounded-xl btn-hero">
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Yaratish
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold flex items-center gap-2"><Tag className="h-4 w-4" /> Promo kodlar ({codes.length})</h3>
        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : codes.map(c => (
          <div key={c.id} className="card-premium p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-mono font-bold text-lg">{c.code}</p>
              <p className="text-xs text-muted-foreground">
                {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.discount_value.toLocaleString()} so'm`} ·
                Ishlatilgan: {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.is_active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                {c.is_active ? 'Faol' : 'Yopiq'}
              </span>
              <Button size="sm" variant="outline" onClick={() => toggle(c.id, c.is_active)} className="rounded-lg"><Power className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="destructive" onClick={() => remove(c.id)} className="rounded-lg"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
