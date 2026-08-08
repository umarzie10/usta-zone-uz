import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, Loader2, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Claim {
  id: string;
  order_id: string;
  client_name: string | null;
  master_name: string | null;
  reason: string;
  photos: string[];
  resolution: string;
  admin_note: string | null;
  created_at: string;
}

const LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  refund: 'Refund qilindi',
  remaster: 'Qayta usta yuborildi',
  rejected: 'Rad etildi',
};

export default function AdminWarranty() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_warranty_claims');
    if (error) toast.error(error.message);
    setClaims((data as unknown as Claim[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: string, resolution: string) => {
    const note = window.prompt('Izoh (ixtiyoriy)') || undefined;
    setBusy(id);
    const { data, error } = await supabase.rpc('admin_resolve_warranty', {
      _id: id, _resolution: resolution, _note: note,
    });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    const res = data as { ok?: boolean; error?: string };
    if (res?.ok) { toast.success('Bajarildi ✅'); load(); }
    else toast.error(res?.error || 'Xatolik');
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Kafolat murojaatlari (7 kun)</h3>
      </div>

      {claims.length === 0 && (
        <p className="text-sm text-muted-foreground">Hozircha murojaat yo‘q.</p>
      )}

      <div className="space-y-3">
        {claims.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4 space-y-3 hover-lift">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{c.client_name || 'Mijoz'} → {c.master_name || 'Usta'}</p>
                <p className="text-xs text-muted-foreground">
                  #{c.order_id.slice(0, 8)} · {new Date(c.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
              <span className="text-xs rounded-full border border-border px-3 py-1">{LABEL[c.resolution] || c.resolution}</span>
            </div>

            <p className="text-sm whitespace-pre-wrap">{c.reason}</p>

            {c.photos?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {c.photos.map((p) => (
                  <img key={p} src={p} alt="Kafolat dalili" loading="lazy"
                    className="h-16 w-16 rounded-lg object-cover border border-border" />
                ))}
              </div>
            )}

            {c.admin_note && <p className="text-xs text-muted-foreground">Izoh: {c.admin_note}</p>}

            {c.resolution === 'pending' && (
              <div className="flex flex-wrap gap-2">
                <button disabled={busy === c.id} onClick={() => resolve(c.id, 'refund')}
                  className="inline-flex items-center gap-1 text-xs rounded-lg bg-primary text-primary-foreground px-3 py-2 disabled:opacity-50">
                  <RotateCcw className="h-3.5 w-3.5" /> Refund
                </button>
                <button disabled={busy === c.id} onClick={() => resolve(c.id, 'remaster')}
                  className="inline-flex items-center gap-1 text-xs rounded-lg border border-border px-3 py-2 disabled:opacity-50">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Qayta usta
                </button>
                <button disabled={busy === c.id} onClick={() => resolve(c.id, 'rejected')}
                  className="inline-flex items-center gap-1 text-xs rounded-lg border border-destructive text-destructive px-3 py-2 disabled:opacity-50">
                  <XCircle className="h-3.5 w-3.5" /> Rad etish
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
