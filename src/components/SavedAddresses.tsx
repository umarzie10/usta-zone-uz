import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Loader2, Trash2, Star, Home, Briefcase } from 'lucide-react';

export default function SavedAddresses() {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: 'Uy', address: '', city: 'Toshkent' });

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('saved_addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  const create = async () => {
    if (!form.address) return;
    setCreating(true);
    try {
      await supabase.from('saved_addresses').insert({ ...form, user_id: user!.id });
      showNotification('success', 'Manzil saqlandi');
      setForm({ label: 'Uy', address: '', city: 'Toshkent' });
      load();
    } catch (err: any) { showNotification('error', err.message); } finally { setCreating(false); }
  };

  const remove = async (id: string) => {
    await supabase.from('saved_addresses').delete().eq('id', id);
    load();
  };

  const setDefault = async (id: string) => {
    await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('saved_addresses').update({ is_default: true }).eq('id', id);
    load();
  };

  const labelIcon = (l: string) => {
    const k = l.toLowerCase();
    if (k.includes('uy') || k.includes('home')) return Home;
    if (k.includes('ish') || k.includes('office') || k.includes('work')) return Briefcase;
    return MapPin;
  };

  return (
    <div className="space-y-4">
      <div className="card-premium p-4 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Yangi manzil</h3>
        <div className="grid grid-cols-3 gap-2">
          {['Uy', 'Ish', 'Boshqa'].map(l => (
            <button key={l} type="button" onClick={() => setForm({ ...form, label: l })}
              className={`p-2 rounded-xl border-2 text-sm transition ${form.label === l ? 'border-primary bg-primary/5 font-bold' : 'border-border'}`}>{l}</button>
          ))}
        </div>
        <Input placeholder="Manzil (ko'cha, uy, kvartira)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="rounded-xl h-11" />
        <Input placeholder="Shahar" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="rounded-xl h-11" />
        <Button onClick={create} disabled={creating || !form.address} className="w-full rounded-xl btn-hero">
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Saqlash
        </Button>
      </div>

      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : addresses.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Saqlangan manzillar yo'q</p>
        </div>
      ) : addresses.map(a => {
        const Icon = labelIcon(a.label);
        return (
          <div key={a.id} className="card-premium p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold">{a.label}</p>
                {a.is_default && <span className="text-[10px] bg-amber-500/15 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">DEFAULT</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{a.address}, {a.city}</p>
            </div>
            <div className="flex gap-1">
              {!a.is_default && <Button size="sm" variant="ghost" onClick={() => setDefault(a.id)} className="rounded-lg"><Star className="h-3.5 w-3.5" /></Button>}
              <Button size="sm" variant="ghost" onClick={() => remove(a.id)} className="rounded-lg text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
