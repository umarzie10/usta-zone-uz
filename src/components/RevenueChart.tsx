import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';

interface Props {
  /** if provided, limits to this master only (master dashboard); else admin = all orders */
  masterUserId?: string;
  days?: number;
}

export default function RevenueChart({ masterUserId, days = 30 }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(); since.setDate(since.getDate() - days);
      let q = supabase.from('orders').select('amount, created_at, status, master_id')
        .gte('created_at', since.toISOString());
      if (masterUserId) q = q.eq('master_id', masterUserId);
      const { data } = await q;
      setOrders(data || []);
      setLoading(false);
    })();
  }, [masterUserId, days]);

  const data = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; orders: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { date: key.slice(5), revenue: 0, orders: 0 });
    }
    for (const o of orders) {
      const key = (o.created_at as string).slice(0, 10);
      const entry = map.get(key);
      if (!entry) continue;
      entry.orders += 1;
      if (o.status === 'completed') entry.revenue += Number(o.amount || 0);
    }
    return Array.from(map.values());
  }, [orders, days]);

  const total = data.reduce((s, d) => s + d.revenue, 0);

  if (loading) return <div className="card-premium p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm">Daromad ({days} kun)</h3>
          <p className="text-2xl font-black text-primary mt-1">{total.toLocaleString()} so'm</p>
        </div>
        <TrendingUp className="h-8 w-8 text-success" />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
            formatter={(v: any) => `${Number(v).toLocaleString()} so'm`}
          />
          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
