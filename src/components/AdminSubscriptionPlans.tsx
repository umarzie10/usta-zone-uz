import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, Crown, Users, User } from 'lucide-react';

interface Plan {
  id: string;
  audience: 'master' | 'client';
  tier: string;
  name: string;
  icon: string;
  badge: string;
  popular: boolean;
  features: string[];
  price_1m: number;
  price_3m: number;
  price_6m: number;
  price_12m: number;
  is_active: boolean;
  order_num: number;
}

const empty: Plan = {
  id: '', audience: 'master', tier: 'basic', name: '', icon: '⭐',
  badge: '', popular: false, features: [],
  price_1m: 0, price_3m: 0, price_6m: 0, price_12m: 0,
  is_active: true, order_num: 0,
};

export default function AdminSubscriptionPlans() {
  const { showNotification } = useApp();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('subscription_plans' as any)
      .select('*')
      .order('audience').order('order_num');
    setPlans((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: any = { ...editing };
      delete payload.id;
      if (editing.id) {
        const { error } = await supabase
          .from('subscription_plans' as any)
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        showNotification('success', 'Tarif yangilandi');
      } else {
        const { error } = await supabase
          .from('subscription_plans' as any)
          .insert(payload);
        if (error) throw error;
        showNotification('success', 'Yangi tarif qo\'shildi');
      }
      setEditing(null);
      await fetch();
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Tarifni o\'chirilsinmi?')) return;
    const { error } = await supabase.from('subscription_plans' as any).delete().eq('id', id);
    if (error) return showNotification('error', error.message);
    showNotification('success', 'O\'chirildi');
    await fetch();
  };

  const masterPlans = plans.filter(p => p.audience === 'master');
  const clientPlans = plans.filter(p => p.audience === 'client');

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const renderGroup = (title: string, icon: any, items: Plan[]) => {
    const Icon = icon;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="font-bold">{title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map(p => (
            <div key={p.id} className="card-premium p-4 border-2 border-border hover:border-primary/40 transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-2xl">{p.icon}</div>
                  <div className="font-black text-lg">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.badge}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>1 oy: <b className="text-foreground">{p.price_1m.toLocaleString()}</b> so'm</div>
                <div>12 oy: <b className="text-foreground">{p.price_12m.toLocaleString()}</b> so'm</div>
                <div>{p.features.length} ta xususiyat • {p.is_active ? 'Faol' : 'Nofaol'}{p.popular && ' • Mashhur'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" /> Obuna tariflari</h2>
          <p className="text-sm text-muted-foreground">Usta va mijoz tariflarini boshqarish</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })} className="rounded-xl btn-hero gap-1.5">
          <Plus className="h-4 w-4" /> Yangi tarif
        </Button>
      </div>

      {renderGroup('Usta tariflari', Users, masterPlans)}
      {renderGroup('Mijoz tariflari', User, clientPlans)}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Tarifni tahrirlash' : 'Yangi tarif qo\'shish'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Auditoriya</Label>
                  <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    value={editing.audience}
                    onChange={e => setEditing({ ...editing, audience: e.target.value as any })}>
                    <option value="master">Usta</option>
                    <option value="client">Mijoz</option>
                  </select>
                </div>
                <div>
                  <Label>Tier (kod)</Label>
                  <Input value={editing.tier} onChange={e => setEditing({ ...editing, tier: e.target.value })} placeholder="basic" />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_80px] gap-3">
                <div><Label>Nom</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="BASIC" /></div>
                <div><Label>Icon</Label><Input value={editing.icon} onChange={e => setEditing({ ...editing, icon: e.target.value })} /></div>
              </div>
              <div><Label>Badge</Label><Input value={editing.badge} onChange={e => setEditing({ ...editing, badge: e.target.value })} placeholder="Yangi boshlovchilar" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Narx 1 oy</Label><Input type="number" value={editing.price_1m} onChange={e => setEditing({ ...editing, price_1m: +e.target.value })} /></div>
                <div><Label>Narx 3 oy</Label><Input type="number" value={editing.price_3m} onChange={e => setEditing({ ...editing, price_3m: +e.target.value })} /></div>
                <div><Label>Narx 6 oy</Label><Input type="number" value={editing.price_6m} onChange={e => setEditing({ ...editing, price_6m: +e.target.value })} /></div>
                <div><Label>Narx 12 oy</Label><Input type="number" value={editing.price_12m} onChange={e => setEditing({ ...editing, price_12m: +e.target.value })} /></div>
              </div>
              <div>
                <Label>Xususiyatlar (har qatorda bittadan)</Label>
                <Textarea rows={6}
                  value={editing.features.join('\n')}
                  onChange={e => setEditing({ ...editing, features: e.target.value.split('\n').filter(Boolean) })} />
              </div>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div><Label>Tartib</Label><Input type="number" value={editing.order_num} onChange={e => setEditing({ ...editing, order_num: +e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={editing.popular} onCheckedChange={v => setEditing({ ...editing, popular: v })} /><span className="text-sm">Mashhur</span></div>
                <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /><span className="text-sm">Faol</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Bekor qilish</Button>
            <Button onClick={save} disabled={saving} className="btn-hero">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
