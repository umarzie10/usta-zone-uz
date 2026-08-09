import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Loader2, CheckCircle2, XCircle, Eye, Clock, BadgeCheck, ShieldOff } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected';

export default function AdminVerificationPanel() {
  const { showNotification } = useApp();
  const [tab, setTab] = useState<Status | 'masters'>('pending');
  const [requests, setRequests] = useState<any[]>([]);
  const [masters, setMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, [tab]);

  const load = async () => {
    setLoading(true);
    if (tab === 'masters') {
      const { data: mps } = await supabase.from('master_profiles')
        .select('id,user_id,verification_tier,verified_at,is_approved').order('verified_at', { ascending: false, nullsFirst: false }).limit(100);
      const ids = (mps || []).map(m => m.user_id);
      const { data: profs } = ids.length
        ? await supabase.rpc('admin_get_profiles', { _user_ids: ids })
        : { data: [] as any[] };
      const pm = new Map<string, any>((profs || []).map((p: any) => [p.user_id, p]));
      setMasters((mps || []).map(m => ({ ...m, profile: pm.get(m.user_id) })));
      setLoading(false); return;
    }

    const { data: reqs } = await supabase.from('verification_requests')
      .select('*').eq('status', tab).order('created_at', { ascending: false }).limit(100);
    if (reqs && reqs.length) {
      const masterIds = reqs.map(r => r.master_id);
      const { data: profiles } = await supabase.from('profiles').select('user_id,full_name,phone,avatar_url').in('user_id', masterIds);
      const pMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setRequests(reqs.map(r => ({ ...r, profile: pMap.get(r.master_id) })));
    } else {
      setRequests([]);
    }
    setLoading(false);
  };

  const openDoc = async (path: string) => {
    const { data } = await supabase.storage.from('verification-docs').createSignedUrl(path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleAction = async (id: string, approve: boolean) => {
    setActioning(id);
    try {
      const { error } = await supabase.rpc('admin_approve_verification', {
        _request_id: id, _approve: approve, _note: notes[id] || null
      });
      if (error) throw error;
      showNotification('success', approve ? 'Tasdiqlandi' : 'Rad etildi');
      load();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally { setActioning(null); }
  };

  const revokeVerified = async (userId: string) => {
    if (!confirm('Verified statusni bekor qilasizmi?')) return;
    setActioning(userId);
    try {
      await supabase.from('master_profiles').update({ verification_tier: 'none' as any, verified_at: null }).eq('user_id', userId);
      await supabase.from('profiles').update({ is_verified: false }).eq('user_id', userId);
      showNotification('success', 'Bekor qilindi');
      load();
    } catch (err: any) { showNotification('error', err.message); }
    finally { setActioning(null); }
  };

  const TABS: { id: typeof tab; label: string; icon: any }[] = [
    { id: 'pending', label: 'Kutilmoqda', icon: Clock },
    { id: 'approved', label: 'Tasdiqlangan', icon: CheckCircle2 },
    { id: 'rejected', label: 'Rad etilgan', icon: XCircle },
    { id: 'masters', label: 'Verified ustalar', icon: BadgeCheck },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Verifikatsiya boshqaruvi</h3>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap ${tab === t.id ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : tab === 'masters' ? (
        masters.length === 0 ? (
          <div className="card-premium p-8 text-center text-sm text-muted-foreground">Verified ustalar yo'q</div>
        ) : masters.map(m => (
          <div key={m.id} className="card-premium p-4 flex items-center gap-3">
            <img src={m.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.profile?.full_name || 'U')}`} className="w-11 h-11 rounded-xl object-cover shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{m.profile?.full_name || '—'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{m.profile?.phone} · <span className="uppercase font-semibold">{m.verification_tier || 'none'}</span></p>
            </div>
            {m.verification_tier && m.verification_tier !== 'none' ? (
              <Button size="sm" variant="outline" onClick={() => revokeVerified(m.user_id)} disabled={actioning === m.user_id}
                className="rounded-lg text-destructive hover:text-destructive shrink-0">
                <ShieldOff className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Bekor qilish</span>
              </Button>
            ) : (
              <span className="text-[11px] text-muted-foreground shrink-0">Verifikatsiyasiz</span>
            )}
          </div>
        ))
      ) : requests.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Bu bo'limda yozuv yo'q</p>
        </div>
      ) : requests.map(r => (
        <div key={r.id} className="card-premium p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-3">
            <img src={r.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.profile?.full_name || 'U')}`} className="w-11 h-11 rounded-xl object-cover shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{r.profile?.full_name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{r.profile?.phone} · <span className="uppercase font-semibold">{r.requested_tier}</span></p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {r.passport_url && <Button size="sm" variant="outline" onClick={() => openDoc(r.passport_url)} className="rounded-lg h-8 text-xs"><Eye className="h-3 w-3 mr-1" /> Passport</Button>}
            {r.selfie_url && <Button size="sm" variant="outline" onClick={() => openDoc(r.selfie_url)} className="rounded-lg h-8 text-xs"><Eye className="h-3 w-3 mr-1" /> Selfie</Button>}
            {r.certificate_url && <Button size="sm" variant="outline" onClick={() => openDoc(r.certificate_url)} className="rounded-lg h-8 text-xs"><Eye className="h-3 w-3 mr-1" /> Sertifikat</Button>}
          </div>

          {tab === 'pending' && (
            <>
              <Textarea placeholder="Izoh (rad etilsa sabab)" value={notes[r.id] || ''}
                onChange={e => setNotes({ ...notes, [r.id]: e.target.value })} className="rounded-xl text-sm" rows={2} />
              <div className="flex gap-2">
                <Button onClick={() => handleAction(r.id, true)} disabled={actioning === r.id}
                  className="flex-1 rounded-xl bg-success hover:bg-success/90 text-white h-10">
                  {actioning === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Tasdiqlash</>}
                </Button>
                <Button onClick={() => handleAction(r.id, false)} disabled={actioning === r.id}
                  variant="destructive" className="flex-1 rounded-xl h-10">
                  <XCircle className="h-4 w-4 mr-1.5" /> Rad etish
                </Button>
              </div>
            </>
          )}
          {r.admin_note && tab !== 'pending' && (
            <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">{r.admin_note}</p>
          )}
        </div>
      ))}
    </div>
  );
}
