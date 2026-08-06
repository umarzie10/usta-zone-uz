import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UserWallet from './UserWallet';
import { fmt } from '@/lib/walletExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Loader2, TrendingUp, Clock, Wallet, PiggyBank, Percent, Briefcase } from 'lucide-react';

export default function MasterWallet() {
  const [sum, setSum] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const [{ data: s }, { data: o }] = await Promise.all([
        supabase.rpc('get_my_earnings_summary'),
        supabase.from('orders').select('id,title,amount,commission_amount,master_amount,client_id,updated_at')
          .eq('master_id', u.user.id).eq('status', 'completed').order('updated_at', { ascending: false }).limit(50),
      ]);
      setSum(s);
      const clientIds = [...new Set((o || []).map((x) => x.client_id))];
      let names = new Map<string, string>();
      if (clientIds.length) {
        const { data: p } = await supabase.from('profiles').select('user_id,full_name').in('user_id', clientIds);
        names = new Map((p || []).map((x) => [x.user_id, x.full_name]));
      }
      setOrders((o || []).map((x) => ({ ...x, client_name: names.get(x.client_id) || 'Mijoz' })));
      setLoading(false);
    })();
  }, []);

  const chartData = (() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const d = new Date(o.updated_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      map.set(d, (map.get(d) || 0) + Number(o.master_amount || 0));
    });
    return [...map.entries()].reverse().map(([name, value]) => ({ name, value }));
  })();

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const cards = [
    { label: 'Kutilayotgan daromad', value: sum?.pending ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Bugungi daromad', value: sum?.today ?? 0, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Haftalik daromad', value: sum?.week ?? 0, icon: Wallet, color: 'text-sky-500' },
    { label: 'Oylik daromad', value: sum?.month ?? 0, icon: PiggyBank, color: 'text-violet-500' },
    { label: 'Jami daromad', value: sum?.total ?? 0, icon: TrendingUp, color: 'text-primary' },
    { label: 'Platforma komissiyasi', value: sum?.commission ?? 0, icon: Percent, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <UserWallet />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="stat-card p-4 reveal">
            <c.icon className={`stat-icon h-5 w-5 mb-2 ${c.color}`} />
            <p className="text-lg font-black">{fmt(c.value)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="stat-card p-4">
          <Briefcase className="stat-icon h-5 w-5 mb-2 text-primary" />
          <p className="text-lg font-black">{sum?.jobs ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Bajarilgan buyurtmalar</p>
        </div>
        <div className="stat-card p-4">
          <TrendingUp className="stat-icon h-5 w-5 mb-2 text-emerald-500" />
          <p className="text-lg font-black">{fmt(sum?.avg ?? 0)}</p>
          <p className="text-[11px] text-muted-foreground">O'rtacha buyurtma narxi</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="card-premium p-5">
          <h3 className="font-bold mb-4">Daromad dinamikasi</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card-premium p-5">
        <h3 className="font-bold mb-4">Daromadlar (bajarilgan buyurtmalar)</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Hali bajarilgan buyurtma yo'q</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Buyurtma</th><th className="py-2 pr-3">Mijoz</th>
                  <th className="py-2 pr-3 text-right">Umumiy</th><th className="py-2 pr-3 text-right">Komissiya</th>
                  <th className="py-2 text-right">Sof daromad</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 row-interactive">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium truncate max-w-[160px]">{o.title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{o.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-2.5 pr-3 truncate max-w-[120px]">{o.client_name}</td>
                    <td className="py-2.5 pr-3 text-right">{fmt(o.amount)}</td>
                    <td className="py-2.5 pr-3 text-right text-orange-500">−{fmt(o.commission_amount)}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{fmt(o.master_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
