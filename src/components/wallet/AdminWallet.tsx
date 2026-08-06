import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { exportCSV, exportExcel, exportPDF, fmt } from '@/lib/walletExport';
import {
  Loader2, Wallet, ArrowUpCircle, Clock, Landmark, ArrowDownCircle, RotateCcw,
  Search, FileText, FileSpreadsheet, FileDown, Check, X, CheckCheck,
} from 'lucide-react';

const W_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Kutilmoqda', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  approved: { label: 'Tasdiqlangan', cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
  completed: { label: 'Yakunlangan', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  rejected: { label: 'Rad etilgan', cls: 'bg-destructive/15 text-destructive' },
};

export default function AdminWallet() {
  const [tab, setTab] = useState<'withdrawals' | 'transactions'>('withdrawals');
  const [overview, setOverview] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [wStatus, setWStatus] = useState('all');
  const [wSearch, setWSearch] = useState('');
  const [wSort, setWSort] = useState<'new' | 'amount'>('new');

  const [tRole, setTRole] = useState('all');
  const [tStatus, setTStatus] = useState('all');
  const [tMethod, setTMethod] = useState('all');
  const [tSearch, setTSearch] = useState('');
  const [tMin, setTMin] = useState('');

  const load = async () => {
    const [{ data: o }, { data: w }, { data: t }] = await Promise.all([
      supabase.rpc('admin_wallet_overview'),
      supabase.rpc('admin_list_withdrawals'),
      supabase.rpc('admin_list_wallet_transactions', { _limit: 500 }),
    ]);
    setOverview(o); setWithdrawals((w as any[]) || []); setTxs((t as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const review = async (id: string, decision: string) => {
    const note = decision === 'rejected' ? window.prompt('Rad etish sababi:') || 'Rad etildi' : null;
    const { data, error } = await supabase.rpc('admin_review_withdrawal', { _id: id, _decision: decision, _note: note });
    if (error || !(data as any)?.ok) { toast.error('Xatolik: ' + (error?.message || '')); return; }
    toast.success('Bajarildi'); load();
  };

  const fWithdrawals = useMemo(() => {
    let r = withdrawals.filter((w) =>
      (wStatus === 'all' || w.status === wStatus) &&
      (!wSearch || (w.full_name || '').toLowerCase().includes(wSearch.toLowerCase()) || w.id.includes(wSearch)));
    r = [...r].sort((a, b) => wSort === 'amount' ? b.amount - a.amount : +new Date(b.created_at) - +new Date(a.created_at));
    return r;
  }, [withdrawals, wStatus, wSearch, wSort]);

  const fTxs = useMemo(() => txs.filter((t) =>
    (tRole === 'all' || t.role === tRole) &&
    (tStatus === 'all' || t.status === tStatus) &&
    (tMethod === 'all' || t.payment_method === tMethod) &&
    (!tMin || Number(t.amount) >= Number(tMin)) &&
    (!tSearch || t.ref_code.toLowerCase().includes(tSearch.toLowerCase()) || (t.full_name || '').toLowerCase().includes(tSearch.toLowerCase()))
  ), [txs, tRole, tStatus, tMethod, tSearch, tMin]);

  const txRows = () => fTxs.map((t) => ({
    ID: t.ref_code, Foydalanuvchi: t.full_name || '—', Rol: t.role || '—',
    Turi: t.type, Holati: t.status, Summa: Math.round(t.amount),
    Usul: t.payment_method || '—', Sana: new Date(t.created_at).toLocaleString(),
  }));

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const stats = [
    { label: 'Platforma daromadi', value: overview?.revenue ?? 0, icon: Landmark, color: 'text-primary' },
    { label: 'Jami pul yechishlar', value: overview?.total_withdrawn ?? 0, icon: ArrowUpCircle, color: 'text-purple-500' },
    { label: 'Kutilayotgan yechishlar', value: overview?.pending_withdrawals ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Umumiy balans', value: overview?.platform_balance ?? 0, icon: Wallet, color: 'text-sky-500' },
    { label: 'Jami to\u2019ldirishlar', value: overview?.total_deposits ?? 0, icon: ArrowDownCircle, color: 'text-emerald-500' },
    { label: 'Refundlar', value: overview?.refunds ?? 0, icon: RotateCcw, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="stat-card p-4 reveal">
            <s.icon className={`stat-icon h-5 w-5 mb-2 ${s.color}`} />
            <p className="text-lg font-black">{fmt(s.value)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {[{ id: 'withdrawals', label: 'Pul yechishlar' }, { id: 'transactions', label: 'Tranzaksiyalar' }].map((x) => (
          <button key={x.id} onClick={() => setTab(x.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === x.id ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'withdrawals' ? (
        <div className="card-premium p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {['all', 'pending', 'approved', 'completed', 'rejected'].map((s) => (
              <button key={s} onClick={() => setWStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${wStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                {s === 'all' ? 'Hammasi' : W_STATUS[s].label}
              </button>
            ))}
            <button onClick={() => setWSort(wSort === 'new' ? 'amount' : 'new')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:text-foreground text-muted-foreground">
              Saralash: {wSort === 'new' ? 'Yangi' : 'Summa'}
            </button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={wSearch} onChange={(e) => setWSearch(e.target.value)} placeholder="Ism yoki ID bo'yicha qidirish..." className="pl-9 rounded-xl" />
          </div>

          {fWithdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">So'rovlar topilmadi</p>
          ) : (
            <div className="space-y-2">
              {fWithdrawals.map((w) => {
                const st = W_STATUS[w.status];
                return (
                  <div key={w.id} className="rounded-xl border border-border p-4 row-interactive">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm">{w.full_name || 'Foydalanuvchi'}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{w.role}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{w.card_masked || 'Karta yo\u2019q'} · {w.card_holder || '—'}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                        {w.admin_note && <p className="text-[11px] text-muted-foreground mt-1">Izoh: {w.admin_note}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-primary">{fmt(w.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">so'm</p>
                      </div>
                    </div>
                    {w.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => review(w.id, 'approved')}><Check className="h-3.5 w-3.5" /> Tasdiqlash</Button>
                        <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => review(w.id, 'completed')}><CheckCheck className="h-3.5 w-3.5" /> Yakunlash</Button>
                        <Button size="sm" variant="ghost" className="rounded-xl gap-1.5 text-destructive" onClick={() => review(w.id, 'rejected')}><X className="h-3.5 w-3.5" /> Rad etish</Button>
                      </div>
                    )}
                    {w.status === 'approved' && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => review(w.id, 'completed')}><CheckCheck className="h-3.5 w-3.5" /> Pul yechishni yakunlash</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="card-premium p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-bold">Barcha tranzaksiyalar</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => exportPDF(txRows(), 'tranzaksiyalar', 'Tranzaksiyalar')}><FileText className="h-3.5 w-3.5" /> PDF</Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => exportExcel(txRows(), 'tranzaksiyalar')}><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => exportCSV(txRows(), 'tranzaksiyalar')}><FileDown className="h-3.5 w-3.5" /> CSV</Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
            <select value={tRole} onChange={(e) => setTRole(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option value="all">Barcha rollar</option><option value="client">Mijoz</option><option value="master">Usta</option>
            </select>
            <select value={tStatus} onChange={(e) => setTStatus(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option value="all">Barcha holatlar</option><option value="pending">Kutilmoqda</option>
              <option value="success">Muvaffaqiyatli</option><option value="cancelled">Bekor qilingan</option><option value="failed">Xatolik</option>
            </select>
            <select value={tMethod} onChange={(e) => setTMethod(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option value="all">Barcha usullar</option>
              {['click', 'payme', 'uzum', 'visa', 'mastercard', 'applepay', 'googlepay', 'card'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <Input type="number" value={tMin} onChange={(e) => setTMin(e.target.value)} placeholder="Min summa" className="rounded-xl" />
            <Input value={tSearch} onChange={(e) => setTSearch(e.target.value)} placeholder="ID / ism" className="rounded-xl" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">ID</th><th className="py-2 pr-3">Foydalanuvchi</th>
                  <th className="py-2 pr-3">Turi</th><th className="py-2 pr-3">Usul</th>
                  <th className="py-2 pr-3">Holati</th><th className="py-2 pr-3 text-right">Summa</th><th className="py-2">Sana</th>
                </tr>
              </thead>
              <tbody>
                {fTxs.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 row-interactive">
                    <td className="py-2.5 pr-3 font-mono text-xs">{t.ref_code}</td>
                    <td className="py-2.5 pr-3 truncate max-w-[140px]">{t.full_name || '—'}</td>
                    <td className="py-2.5 pr-3 text-xs">{t.type}</td>
                    <td className="py-2.5 pr-3 text-xs">{t.payment_method || '—'}</td>
                    <td className="py-2.5 pr-3 text-xs">{t.status}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold">{fmt(t.amount)}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fTxs.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Tranzaksiyalar topilmadi</p>}
          </div>
        </div>
      )}
    </div>
  );
}
