import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, CheckCircle2, X, Loader2 } from 'lucide-react';

interface Props {
  orderAmount: number;
  onApplied: (data: { promo_code_id: string; discount: number; final_amount: number; code: string }) => void;
}

export default function PromoCodeInput({ orderAmount, onApplied }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<{ discount: number; code: string } | null>(null);
  const [error, setError] = useState('');

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true); setError('');
    const { data, error: rpcErr } = await supabase.rpc('apply_promo_code', { _code: code.trim(), _order_amount: orderAmount });
    setLoading(false);
    if (rpcErr) { setError(rpcErr.message); return; }
    const r = data as any;
    if (!r?.ok) {
      const msgs: Record<string, string> = {
        invalid_code: 'Promo kod topilmadi', expired: 'Muddati tugagan',
        inactive: "Bu promo kod hozircha faol emas",
        is_referral: "Bu taklif (referral) kodi — promo kod emas",
        limit_reached: 'Limit tugagan', already_used: 'Siz allaqachon ishlatgansiz',
        min_amount: `Minimal summa: ${r.required?.toLocaleString()} so'm`,
      };
      setError(msgs[r?.error] || 'Xatolik'); return;
    }
    setApplied({ discount: r.discount, code: code.trim().toUpperCase() });
    onApplied({ promo_code_id: r.promo_code_id, discount: r.discount, final_amount: r.final_amount, code: code.trim().toUpperCase() });
  };

  const remove = () => { setApplied(null); setCode(''); onApplied({ promo_code_id: '', discount: 0, final_amount: orderAmount, code: '' }); };

  if (applied) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/30">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span className="font-bold text-sm truncate">{applied.code}</span>
          <span className="text-xs text-success font-semibold">-{applied.discount.toLocaleString()} so'm</span>
        </div>
        <button onClick={remove} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="PROMO KOD"
            className="rounded-xl h-11 pl-9 font-mono uppercase" />
        </div>
        <Button onClick={apply} disabled={loading || !code} className="rounded-xl h-11 px-5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Qo'llash"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  );
}
