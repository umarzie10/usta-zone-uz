import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Crown, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminFoundingSettings() {
  const [enabled, setEnabled] = useState(true);
  const [limit, setLimit] = useState('100');
  const [assigned, setAssigned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('platform_settings').select('value').eq('key', 'founding_master').maybeSingle();
    const v = (data?.value as any) || {};
    setEnabled(v.enabled !== false);
    setLimit(String(v.limit ?? 100));

    const { count } = await supabase
      .from('master_profiles')
      .select('id', { count: 'exact', head: true })
      .not('founding_number', 'is', null);
    setAssigned(count || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const n = parseInt(limit, 10);
    if (isNaN(n) || n < 0 || n > 100000) { toast.error('Limit 0 dan 100000 gacha bo\'lishi kerak'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('platform_settings')
      .upsert({ key: 'founding_master', value: { enabled, limit: n } as any }, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error('Saqlashda xatolik: ' + error.message); return; }
    toast.success('Sozlamalar saqlandi');
    load();
  };

  const resync = async () => {
    setResyncing(true);
    const { data, error } = await supabase.rpc('admin_resync_founding_numbers');
    setResyncing(false);
    if (error) { toast.error(error.message); return; }
    const res = data as any;
    toast.success(`Qayta raqamlandi: ${res?.assigned ?? 0} ta usta`);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="card-premium p-6 max-w-xl space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <h3 className="font-bold">Asoschi Usta nishoni</h3>
      </div>

      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/50">
        <div>
          <p className="text-sm font-medium">Nishonni yoqish</p>
          <p className="text-xs text-muted-foreground">O'chirilsa, yangi ustalarga raqam berilmaydi</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div>
        <label className="text-sm font-medium">Nechta usta nishon oladi (N)</label>
        <Input
          className="rounded-xl h-11 mt-1.5"
          type="number" min={0} max={100000}
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ro'yxatdan o'tish tartibi bo'yicha birinchi {limit || 0} ta ustaga #1, #2 ... raqamlari avtomatik beriladi.
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
        <p className="text-sm">Hozir nishonga ega ustalar</p>
        <p className="font-bold text-primary">{assigned}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button className="rounded-xl h-11 px-5" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Saqlash'}
        </Button>
        <Button variant="outline" className="rounded-xl h-11 px-5 gap-2" onClick={resync} disabled={resyncing}>
          {resyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Qayta raqamlash
        </Button>
      </div>
    </div>
  );
}
