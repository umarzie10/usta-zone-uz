import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Loader2, CheckCircle2, XCircle, Eye } from 'lucide-react';

export default function AdminVerificationPanel() {
  const { showNotification } = useApp();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: reqs } = await supabase.from('verification_requests')
      .select('*').eq('status', 'pending').order('created_at', { ascending: false });
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

  const getSignedUrl = async (path: string) => {
    if (previewUrls[path]) return previewUrls[path];
    const { data } = await supabase.storage.from('verification-docs').createSignedUrl(path, 600);
    if (data?.signedUrl) {
      setPreviewUrls(prev => ({ ...prev, [path]: data.signedUrl }));
      window.open(data.signedUrl, '_blank');
    }
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

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Verifikatsiya so'rovlari ({requests.length})
        </h3>
      </div>

      {requests.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Yangi so'rovlar yo'q</p>
        </div>
      ) : (
        requests.map(r => (
          <div key={r.id} className="card-premium p-5 space-y-4">
            <div className="flex items-center gap-3">
              <img src={r.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.profile?.full_name || 'U')}`} className="w-12 h-12 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <p className="font-bold">{r.profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{r.profile?.phone} · So'ralgan: <span className="font-semibold uppercase">{r.requested_tier}</span></p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {r.passport_url && (
                <Button size="sm" variant="outline" onClick={() => getSignedUrl(r.passport_url)} className="rounded-lg">
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Passport
                </Button>
              )}
              {r.selfie_url && (
                <Button size="sm" variant="outline" onClick={() => getSignedUrl(r.selfie_url)} className="rounded-lg">
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Selfie
                </Button>
              )}
              {r.certificate_url && (
                <Button size="sm" variant="outline" onClick={() => getSignedUrl(r.certificate_url)} className="rounded-lg">
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Sertifikat
                </Button>
              )}
            </div>

            <Textarea placeholder="Izoh (rad etilsa sabab)" value={notes[r.id] || ''}
              onChange={e => setNotes({ ...notes, [r.id]: e.target.value })} className="rounded-xl text-sm" rows={2} />

            <div className="flex gap-2">
              <Button onClick={() => handleAction(r.id, true)} disabled={actioning === r.id}
                className="flex-1 rounded-xl bg-success hover:bg-success/90 text-white">
                {actioning === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Tasdiqlash
              </Button>
              <Button onClick={() => handleAction(r.id, false)} disabled={actioning === r.id}
                variant="destructive" className="flex-1 rounded-xl">
                <XCircle className="h-4 w-4 mr-1.5" /> Rad etish
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
