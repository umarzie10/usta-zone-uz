import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { exportCSV, exportExcel, exportPDF, fmt } from '@/lib/walletExport';
import {
  Wallet, Snowflake, ArrowDownCircle, ArrowUpCircle, TrendingDown, Plus,
  CreditCard, History, Loader2, Search, FileText, FileSpreadsheet, Trash2,
  CheckCircle2, Star, Shield,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'click', label: 'Click', color: 'from-sky-500 to-blue-600' },
  { id: 'payme', label: 'Payme', color: 'from-cyan-500 to-teal-500' },
  { id: 'uzum', label: 'Uzum Bank', color: 'from-violet-500 to-purple-600' },
  { id: 'visa', label: 'Visa', color: 'from-blue-600 to-indigo-700' },
  { id: 'mastercard', label: 'Mastercard', color: 'from-orange-500 to-red-500' },
  { id: 'applepay', label: 'Apple Pay', color: 'from-neutral-600 to-neutral-900' },
  { id: 'googlepay', label: 'Google Pay', color: 'from-emerald-500 to-green-600' },
];

const QUICK_AMOUNTS = [20000, 50000, 100000, 250000, 500000, 1000000];

const TX_TYPE_LABEL: Record<string, string> = {
  deposit: 'Balans to\u2019ldirish', withdrawal: 'Pul yechish', payment: 'To\u2019lov',
  refund: 'Refund', bonus: 'Bonus', earning: 'Daromad', commission: 'Komissiya',
};
const TX_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Kutilmoqda', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  success: { label: 'Muvaffaqiyatli', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  cancelled: { label: 'Bekor qilingan', cls: 'bg-muted text-muted-foreground' },
  failed: { label: 'Xatolik', cls: 'bg-destructive/15 text-destructive' },
};
const PERIODS = [
  { id: 'all', label: 'Hammasi' }, { id: 'today', label: 'Bugun' },
  { id: 'week', label: 'Hafta' }, { id: 'month', label: 'Oy' }, { id: 'year', label: 'Yil' },
];

interface WalletRow {
  balance: number; frozen_balance: number; total_deposited: number;
  total_spent: number; total_withdrawn: number;
}

export default function UserWallet() {
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [period, setPeriod] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    const [{ data: w }, { data: t }, { data: c }, { data: wd }] = await Promise.all([
      supabase.rpc('get_my_wallet'),
      supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('bank_cards').select('*').order('is_default', { ascending: false }),
      supabase.from('wallet_withdrawals').select('*').order('created_at', { ascending: false }),
    ]);
    setWallet((Array.isArray(w) ? w[0] : w) as WalletRow);
    setTxs(t || []); setCards(c || []); setWithdrawals(wd || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const spans: Record<string, number> = { today: 864e5, week: 7 * 864e5, month: 30 * 864e5, year: 365 * 864e5 };
    return txs.filter((t) => {
      const ts = new Date(t.created_at).getTime();
      if (period === 'custom') {
        if (customFrom && ts < new Date(customFrom).getTime()) return false;
        if (customTo && ts > new Date(customTo).getTime() + 864e5) return false;
      } else if (period !== 'all' && now - ts > spans[period]) return false;
      if (search && !t.ref_code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [txs, period, search, customFrom, customTo]);

  const exportRows = () => filtered.map((t) => ({
    ID: t.ref_code,
    Sana: new Date(t.created_at).toLocaleDateString(),
    Vaqt: new Date(t.created_at).toLocaleTimeString(),
    Summa: Math.round(t.amount),
    Turi: TX_TYPE_LABEL[t.type] || t.type,
    Usul: t.payment_method || '—',
    Holati: TX_STATUS[t.status]?.label || t.status,
    Izoh: t.note || '',
  }));

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2400);
  };

  const stats = [
    { label: 'Mavjud balans', value: wallet?.balance ?? 0, icon: Wallet, color: 'text-primary' },
    { label: 'Muzlatilgan', value: wallet?.frozen_balance ?? 0, icon: Snowflake, color: 'text-sky-500' },
    { label: 'Jami qo\u2019shilgan', value: wallet?.total_deposited ?? 0, icon: ArrowDownCircle, color: 'text-emerald-500' },
    { label: 'Jami sarflangan', value: wallet?.total_spent ?? 0, icon: TrendingDown, color: 'text-orange-500' },
    { label: 'Jami yechilgan', value: wallet?.total_withdrawn ?? 0, icon: ArrowUpCircle, color: 'text-purple-500' },
  ];

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Hero balance */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 p-6 sm:p-8 text-primary-foreground shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10 animate-float" />
        <div className="absolute -bottom-16 right-24 h-48 w-48 rounded-full bg-primary-foreground/5" />
        <p className="text-sm opacity-80">Mavjud balans</p>
        <p className="text-4xl sm:text-5xl font-black tracking-tight mt-1">{fmt(wallet?.balance ?? 0)} <span className="text-xl font-bold opacity-80">so'm</span></p>
        <div className="flex flex-wrap gap-2 mt-5">
          <Button onClick={() => setDepositOpen(true)} className="rounded-xl gap-2 bg-background text-foreground hover:bg-background/90">
            <Plus className="h-4 w-4" /> Pul qo'shish
          </Button>
          <Button onClick={() => setWithdrawOpen(true)} variant="outline" className="rounded-xl gap-2 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
            <ArrowUpCircle className="h-4 w-4" /> Pul yechish
          </Button>
          <Button onClick={() => document.getElementById('wallet-history')?.scrollIntoView({ behavior: 'smooth' })} variant="ghost" className="rounded-xl gap-2 text-primary-foreground hover:bg-primary-foreground/10">
            <History className="h-4 w-4" /> Balans tarixi
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="stat-card p-4 reveal">
            <s.icon className={`stat-icon h-5 w-5 mb-2 ${s.color}`} />
            <p className="text-lg font-black truncate">{fmt(s.value)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Bank kartalari</h3>
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setCardOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Karta qo'shish
          </Button>
        </div>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Hali karta qo'shilmagan</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.id} className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted to-background p-4 hover-lift">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-bold tracking-widest">{c.card_masked}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.card_holder} · {c.expiry || '--/--'}</p>
                  </div>
                  <div className="flex gap-1">
                    {c.is_default && <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/15 text-primary font-semibold">Asosiy</span>}
                    {c.is_verified && <Shield className="h-4 w-4 text-emerald-500" />}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {!c.is_default && (
                    <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs gap-1"
                      onClick={async () => {
                        await supabase.from('bank_cards').update({ is_default: false }).neq('id', c.id);
                        await supabase.from('bank_cards').update({ is_default: true }).eq('id', c.id);
                        toast.success('Asosiy karta yangilandi'); load();
                      }}><Star className="h-3 w-3" /> Asosiy</Button>
                  )}
                  {!c.is_verified && (
                    <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs gap-1"
                      onClick={async () => {
                        await supabase.from('bank_cards').update({ is_verified: true }).eq('id', c.id);
                        toast.success('Karta tasdiqlandi'); load();
                      }}><CheckCircle2 className="h-3 w-3" /> Tasdiqlash</Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs gap-1 text-destructive"
                    onClick={async () => { await supabase.from('bank_cards').delete().eq('id', c.id); toast.success('Karta o\u2019chirildi'); load(); }}>
                    <Trash2 className="h-3 w-3" /> O'chirish</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending withdrawals */}
      {withdrawals.filter((w) => w.status === 'pending').length > 0 && (
        <div className="card-premium p-5">
          <h3 className="font-bold mb-3">Kutilayotgan yechishlar</h3>
          <div className="space-y-2">
            {withdrawals.filter((w) => w.status === 'pending').map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <div>
                  <p className="font-semibold text-sm">{fmt(w.amount)} so'm</p>
                  <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">Kutilmoqda</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div id="wallet-history" className="card-premium p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-bold flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Tranzaksiyalar tarixi</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => exportPDF(exportRows(), 'tranzaksiyalar', 'Tranzaksiyalar')}><FileText className="h-3.5 w-3.5" /> PDF</Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => exportExcel(exportRows(), 'tranzaksiyalar')}><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {[...PERIODS, { id: 'custom', label: 'Maxsus sana' }].map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex flex-wrap gap-2 mb-3">
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-xl w-auto" />
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-xl w-auto" />
          </div>
        )}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tranzaksiya ID bo'yicha qidirish..." className="pl-9 rounded-xl" />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Tranzaksiyalar topilmadi</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => {
              const st = TX_STATUS[t.status] || TX_STATUS.pending;
              const positive = ['deposit', 'refund', 'bonus', 'earning'].includes(t.type);
              return (
                <div key={t.id} className="row-interactive flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm">{TX_TYPE_LABEL[t.type] || t.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {t.ref_code} · {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString()}
                      {t.payment_method ? ` · ${t.payment_method}` : ''}
                    </p>
                    {t.note && <p className="text-[11px] text-muted-foreground truncate">{t.note}</p>}
                  </div>
                  <p className={`font-bold text-sm shrink-0 ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                    {positive ? '+' : '−'}{fmt(t.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DepositDialog open={depositOpen} onClose={() => setDepositOpen(false)} onDone={(m) => { load(); showSuccess(m); }} />
      <WithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} cards={cards} balance={wallet?.balance ?? 0}
        onDone={(m) => { load(); showSuccess(m); }} onAddCard={() => { setWithdrawOpen(false); setCardOpen(true); }} />
      <AddCardDialog open={cardOpen} onClose={() => setCardOpen(false)} onDone={() => { load(); toast.success('Karta qo\u2019shildi'); }} />

      {success && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/70 backdrop-blur-sm animate-fade-in">
          <div className="card-premium px-8 py-10 text-center animate-scale-in">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-11 w-11 text-emerald-500" />
            </div>
            <p className="text-lg font-bold">{success}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DepositDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (m: string) => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('click');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1000) { toast.error('Minimal summa 1 000 so\u2019m'); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('wallet_deposit', { _amount: amt, _method: method });
    setBusy(false);
    const res = data as any;
    if (error || !res?.ok) { toast.error(res?.error === 'max_amount' ? 'Maksimal summa oshib ketdi' : 'Xatolik yuz berdi'); return; }
    setAmount(''); onClose(); onDone('To\u2019lov muvaffaqiyatli!');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Balansga pul qo'shish</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Summa (so'm)</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" className="rounded-xl text-lg font-bold" />
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_AMOUNTS.map((a) => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-all">
                  {fmt(a)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">To'lov usuli</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`rounded-xl p-3 text-sm font-semibold text-white bg-gradient-to-br ${m.color} transition-all ${method === m.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' : 'opacity-70 hover:opacity-100'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={submit} disabled={busy} className="w-full rounded-xl btn-hero gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} To'lovni tasdiqlash
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawDialog({ open, onClose, cards, balance, onDone, onAddCard }: {
  open: boolean; onClose: () => void; cards: any[]; balance: number;
  onDone: (m: string) => void; onAddCard: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [cardId, setCardId] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setStep('form'); setOtp(''); setCardId(cards.find((c) => c.is_default)?.id || cards[0]?.id || ''); } }, [open, cards]);

  const next = () => {
    const amt = Number(amount);
    if (!cardId) { toast.error('Kartani tanlang'); return; }
    if (amt < 10000) { toast.error('Minimal yechish summasi 10 000 so\u2019m'); return; }
    if (amt > 20000000) { toast.error('Maksimal yechish summasi 20 000 000 so\u2019m'); return; }
    if (amt > balance) { toast.error('Balans yetarli emas'); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtp(code); setStep('otp');
    toast.info(`Tasdiqlash kodi: ${code}`, { duration: 15000 });
  };

  const submit = async () => {
    if (otp !== sentOtp) { toast.error('OTP kod noto\u2019g\u2019ri'); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('wallet_request_withdrawal', { _amount: Number(amount), _card_id: cardId, _otp: otp });
    setBusy(false);
    const res = data as any;
    if (error || !res?.ok) {
      const map: Record<string, string> = { insufficient: 'Balans yetarli emas', min_amount: 'Minimal summa 10 000 so\u2019m', max_amount: 'Maksimal summa oshib ketdi', invalid_card: 'Karta topilmadi' };
      toast.error(map[res?.error] || 'Xatolik yuz berdi'); return;
    }
    setAmount(''); onClose(); onDone('So\u2019rov yuborildi, admin tasdig\u2019ini kuting');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Pul yechish</DialogTitle></DialogHeader>
        {step === 'form' ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted p-3 text-sm">Mavjud balans: <b>{fmt(balance)} so'm</b></div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Karta</label>
              {cards.length === 0 ? (
                <Button variant="outline" className="w-full rounded-xl gap-2" onClick={onAddCard}><Plus className="h-4 w-4" /> Yangi karta qo'shish</Button>
              ) : (
                <div className="space-y-2">
                  {cards.map((c) => (
                    <button key={c.id} onClick={() => setCardId(c.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${cardId === c.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <p className="font-mono text-sm font-bold">{c.card_masked}</p>
                      <p className="text-xs text-muted-foreground">{c.card_holder}</p>
                    </button>
                  ))}
                  <Button variant="ghost" size="sm" className="rounded-xl gap-1.5" onClick={onAddCard}><Plus className="h-3.5 w-3.5" /> Yangi karta</Button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Summa</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100000" className="rounded-xl" />
              <p className="text-xs text-muted-foreground mt-1">Min 10 000 · Max 20 000 000 so'm</p>
            </div>
            <Button onClick={next} className="w-full rounded-xl btn-hero">Davom etish</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Telefoningizga yuborilgan 6 xonali kodni kiriting.</p>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="______"
              className="rounded-xl text-center text-2xl font-black tracking-[0.5em]" />
            <Button onClick={submit} disabled={busy} className="w-full rounded-xl btn-hero gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Tasdiqlash
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddCardDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const digits = number.replace(/\D/g, '');
    if (digits.length < 16) { toast.error('Karta raqami 16 xonali bo\u2019lishi kerak'); return; }
    if (!holder.trim()) { toast.error('Karta egasini kiriting'); return; }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setBusy(true);
    const { error } = await supabase.from('bank_cards').insert({
      user_id: u.user.id,
      card_holder: holder.trim().toUpperCase(),
      card_last4: digits.slice(-4),
      card_masked: `**** **** **** ${digits.slice(-4)}`,
      brand: digits.startsWith('8600') || digits.startsWith('5614') ? 'uzcard' : digits.startsWith('9860') ? 'humo' : digits.startsWith('4') ? 'visa' : 'mastercard',
      expiry: expiry || null,
    });
    setBusy(false);
    if (error) { toast.error('Xatolik: ' + error.message); return; }
    setNumber(''); setHolder(''); setExpiry(''); onClose(); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Yangi karta qo'shish</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="8600 0000 0000 0000" maxLength={19} className="rounded-xl font-mono" />
          <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="KARTA EGASI" className="rounded-xl uppercase" />
          <Input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} className="rounded-xl" />
          <Button onClick={submit} disabled={busy} className="w-full rounded-xl btn-hero gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Saqlash
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
