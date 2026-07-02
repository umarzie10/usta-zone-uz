import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, DollarSign, Save, Trash2, Info } from 'lucide-react';

interface Sub { id: string; name_uz: string; }
interface Service {
  id?: string;
  master_id: string;
  category_id: string;
  title: string;
  pricing_type: 'fixed' | 'from' | 'hourly';
  price: number | null;
  price_max: number | null;
  is_active: boolean;
  _dirty?: boolean;
  _new?: boolean;
}

export default function SubcategoryPricing() {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mpId, setMpId] = useState<string>('');
  const [subs, setSubs] = useState<Sub[]>([]);
  const [rows, setRows] = useState<Record<string, Service>>({});

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data: mp } = await supabase.from('master_profiles')
      .select('id,subcategory_ids').eq('user_id', user!.id).maybeSingle();
    if (!mp) { setLoading(false); return; }
    setMpId(mp.id);
    const subIds: string[] = mp.subcategory_ids || [];
    if (!subIds.length) { setSubs([]); setRows({}); setLoading(false); return; }

    const [{ data: cats }, { data: services }] = await Promise.all([
      supabase.from('categories').select('id,name_uz').in('id', subIds),
      supabase.from('services').select('*').eq('master_id', mp.id).in('category_id', subIds),
    ]);
    setSubs(cats || []);
    const map: Record<string, Service> = {};
    for (const sid of subIds) {
      const existing = services?.find(s => s.category_id === sid);
      if (existing) {
        map[sid] = { ...existing, pricing_type: (existing.pricing_type as any) || 'from', _dirty: false };
      } else {
        const name = cats?.find(c => c.id === sid)?.name_uz || 'Xizmat';
        map[sid] = {
          master_id: mp.id, category_id: sid, title: name,
          pricing_type: 'from', price: null, price_max: null, is_active: true,
          _new: true, _dirty: false,
        };
      }
    }
    setRows(map);
    setLoading(false);
  };

  const update = (sid: string, patch: Partial<Service>) =>
    setRows(r => ({ ...r, [sid]: { ...r[sid], ...patch, _dirty: true } }));

  const saveOne = async (sid: string) => {
    const r = rows[sid];
    if (!r) return;
    setSaving(true);
    try {
      const payload: any = {
        master_id: r.master_id,
        category_id: r.category_id,
        title: r.title || 'Xizmat',
        pricing_type: r.pricing_type,
        price: r.price,
        price_max: r.pricing_type === 'from' ? r.price_max : null,
        is_active: r.is_active,
      };
      let res;
      if (r._new) res = await supabase.from('services').insert(payload).select().single();
      else res = await supabase.from('services').update(payload).eq('id', r.id!).select().single();
      if (res.error) throw res.error;
      setRows(prev => ({ ...prev, [sid]: { ...res.data, _dirty: false, pricing_type: (res.data.pricing_type as any) || 'from' } }));
      showNotification('success', 'Narx saqlandi');
    } catch (e: any) {
      showNotification('error', e.message);
    } finally { setSaving(false); }
  };

  const removeOne = async (sid: string) => {
    const r = rows[sid];
    if (!r || r._new) { setRows(p => ({ ...p, [sid]: { ...r, price: null, price_max: null, _dirty: true } })); return; }
    if (!confirm('Ushbu subkategoriya narxini o\'chirasizmi?')) return;
    const { error } = await supabase.from('services').delete().eq('id', r.id!);
    if (error) return showNotification('error', error.message);
    showNotification('success', 'O\'chirildi');
    load();
  };

  const saveAll = async () => {
    for (const sid of Object.keys(rows)) {
      if (rows[sid]._dirty) await saveOne(sid);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  if (!subs.length) {
    return (
      <div className="card-premium p-6 text-center space-y-2">
        <Info className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm font-medium">Subkategoriya tanlanmagan</p>
        <p className="text-xs text-muted-foreground">Avval "Sozlamalar" bo'limidan subkategoriyalarni tanlang.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card-premium p-4 flex items-start gap-3 bg-primary/5 border-primary/20">
        <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold">Har bir xizmat uchun narx</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <b>Boshlang'ich</b> — minimum narx. <b>Kelishilgan</b> — maksimum narx yoki "kelishuv" bo'yicha yuqori chegara.
          </p>
        </div>
      </div>

      {subs.map(s => {
        const r = rows[s.id];
        if (!r) return null;
        return (
          <div key={s.id} className="card-premium p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{s.name_uz}</p>
                <p className="text-[11px] text-muted-foreground">{r._new ? 'Yangi' : 'Aktiv xizmat'}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <select value={r.pricing_type} onChange={e => update(s.id, { pricing_type: e.target.value as any })}
                  className="h-9 rounded-lg border border-border bg-background text-xs px-2">
                  <option value="from">Boshlab</option>
                  <option value="fixed">Aniq narx</option>
                  <option value="hourly">Soatbay</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">
                  {r.pricing_type === 'hourly' ? 'Soatlik narx (so\'m)' : 'Boshlang\'ich narx (so\'m)'}
                </Label>
                <Input type="number" min={0} inputMode="numeric"
                  value={r.price ?? ''}
                  onChange={e => update(s.id, { price: e.target.value === '' ? null : +e.target.value })}
                  placeholder="150000" className="mt-1 h-10 rounded-lg" />
              </div>
              {r.pricing_type === 'from' && (
                <div>
                  <Label className="text-[11px] text-muted-foreground">Kelishilgan (maks) narx</Label>
                  <Input type="number" min={0} inputMode="numeric"
                    value={r.price_max ?? ''}
                    onChange={e => update(s.id, { price_max: e.target.value === '' ? null : +e.target.value })}
                    placeholder="500000" className="mt-1 h-10 rounded-lg" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveOne(s.id)} disabled={saving || !r._dirty}
                className="flex-1 rounded-lg btn-hero h-9">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {r._dirty ? 'Saqlash' : 'Saqlandi'}
              </Button>
              {!r._new && (
                <Button size="sm" variant="outline" onClick={() => removeOne(s.id)}
                  className="rounded-lg h-9 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Button onClick={saveAll} disabled={saving} className="w-full h-11 rounded-xl btn-hero">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Barcha narxlarni saqlash
      </Button>
    </div>
  );
}
