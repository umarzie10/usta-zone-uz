import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, TrendingUp, Gift, Copy, Check, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import AnimatedCounter from '@/components/AnimatedCounter';

interface Stats {
  code: string;
  total: number;
  converted: number;
  conversion_rate: number;
  earned: number;
  pending: number;
  bonus_per_referral: number;
}

interface Row {
  id: string;
  full_name: string;
  status: string;
  bonus_amount: number;
  created_at: string;
  converted_at: string | null;
}

export default function ReferralDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const [{ data: s }, { data: list }] = await Promise.all([
      supabase.rpc('get_my_referral_stats'),
      supabase.rpc('get_my_referral_list'),
    ]);
    if (s && (s as any).ok) setStats(s as unknown as Stats);
    setRows((list as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // realtime: yangi takliflar va konversiyalar
    const ch = supabase
      .channel('referrals-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const link = stats ? `${window.location.origin}/register?ref=${stats.code}` : '';

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Havola nusxalandi');
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'UstaZone', text: 'UstaZone platformasiga qo\'shiling!', url: link }); } catch { /* bekor qilindi */ }
    } else copy();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!stats) return <p className="text-muted-foreground text-sm">Ma'lumot topilmadi.</p>;

  const cards = [
    { label: 'Takliflar soni', value: stats.total, icon: Users, suffix: '' },
    { label: 'Konversiya', value: stats.conversion_rate, icon: TrendingUp, suffix: '%' },
    { label: 'Kutilayotgan bonus', value: stats.pending, icon: Gift, suffix: " so'm" },
    { label: 'Olingan bonus', value: stats.earned, icon: Gift, suffix: " so'm" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card-premium p-5">
        <h3 className="font-bold mb-1">Sizning taklif kodingiz</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Har bir taklif qilingan foydalanuvchi birinchi buyurtmasini yakunlaganda sizga{' '}
          <span className="font-semibold text-primary">{stats.bonus_per_referral.toLocaleString()} so'm</span> bonus beriladi.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input readOnly value={link} className="rounded-xl h-11 text-xs sm:text-sm" />
          <div className="flex gap-2">
            <Button className="rounded-xl h-11 px-4 gap-2" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Nusxa
            </Button>
            <Button variant="outline" className="rounded-xl h-11 px-4 gap-2" onClick={share}>
              <Share2 className="h-4 w-4" /> Ulashish
            </Button>
          </div>
        </div>
        <p className="mt-3 text-sm">Kod: <span className="font-black tracking-widest text-primary">{stats.code}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <div key={c.label} className="stat-card card-premium p-4" data-reveal-i={i}>
            <c.icon className="h-4 w-4 text-primary mb-2" />
            <p className="text-lg sm:text-xl font-black">
              <AnimatedCounter value={c.value} />{c.suffix}
            </p>
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card-premium p-5">
        <h3 className="font-bold mb-3">Taklif qilinganlar</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hozircha hech kim taklif qilinmagan.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="row-interactive flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{r.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  r.status === 'converted' ? 'bg-success/15 text-success' : 'bg-amber-500/15 text-amber-600'
                }`}>
                  {r.status === 'converted' ? `+${Number(r.bonus_amount).toLocaleString()} so'm` : 'Kutilmoqda'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
