import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Upload, Loader2, CheckCircle2, Clock, XCircle, Award, Medal, Crown } from 'lucide-react';

const TIERS = [
  { id: 'bronze', label: 'Bronze', icon: Award, color: 'text-amber-700 bg-amber-700/10', desc: 'Passport + Selfie', reqs: ['passport', 'selfie'] },
  { id: 'silver', label: 'Silver', icon: Medal, color: 'text-slate-400 bg-slate-400/10', desc: 'Bronze + Sertifikat', reqs: ['passport', 'selfie', 'certificate'] },
  { id: 'gold', label: 'Gold', icon: Crown, color: 'text-amber-500 bg-amber-500/10', desc: 'Silver + 50+ buyurtma', reqs: ['passport', 'selfie', 'certificate'] },
];

export default function VerificationCenter({ currentTier }: { currentTier: string }) {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('bronze');
  const [files, setFiles] = useState<{ passport?: File; selfie?: File; certificate?: File }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    const { data } = await supabase.from('verification_requests')
      .select('*').eq('master_id', user!.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    setRequest(data);
    setLoading(false);
  };

  const uploadFile = async (key: 'passport' | 'selfie' | 'certificate', file: File) => {
    const path = `${user!.id}/${key}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('verification-docs').upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    if (!files.passport || !files.selfie) { showNotification('error', 'Passport va selfie majburiy'); return; }
    setSubmitting(true);
    try {
      const passport_url = await uploadFile('passport', files.passport);
      const selfie_url = await uploadFile('selfie', files.selfie);
      const certificate_url = files.certificate ? await uploadFile('certificate', files.certificate) : null;
      await supabase.from('verification_requests').insert({
        master_id: user!.id,
        passport_url, selfie_url, certificate_url,
        requested_tier: selectedTier as any,
        status: 'pending',
      });
      showNotification('success', 'Verifikatsiya so\'rovi yuborildi!');
      load();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  const tierInfo = TIERS.find(t => t.id === currentTier);

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${tierInfo?.color || 'bg-muted'}`}>
            {tierInfo ? <tierInfo.icon className="h-8 w-8" /> : <Shield className="h-8 w-8 text-muted-foreground" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hozirgi daraja</p>
            <h3 className="text-2xl font-black">{tierInfo?.label || 'Verifikatsiya qilinmagan'}</h3>
          </div>
        </div>
      </div>

      {/* Pending request */}
      {request && request.status === 'pending' && (
        <div className="card-premium p-5 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-bold">So'rov ko'rib chiqilmoqda</p>
              <p className="text-xs text-muted-foreground">{request.requested_tier} darajasi · {new Date(request.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {request && request.status === 'rejected' && (
        <div className="card-premium p-5 border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Rad etildi</p>
              {request.admin_note && <p className="text-sm text-muted-foreground mt-1">{request.admin_note}</p>}
            </div>
          </div>
        </div>
      )}

      {/* New submission */}
      {(!request || request.status !== 'pending') && (
        <div className="card-premium p-6 space-y-5">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Yangi verifikatsiya so'rovi
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {TIERS.map(t => (
              <button key={t.id} onClick={() => setSelectedTier(t.id)}
                className={`p-3 rounded-xl border-2 transition text-left ${selectedTier === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <t.icon className={`h-5 w-5 mb-1.5 ${t.color.split(' ')[0]}`} />
                <p className="font-bold text-sm">{t.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>

          {(['passport', 'selfie', 'certificate'] as const).map(key => {
            const required = TIERS.find(t => t.id === selectedTier)?.reqs.includes(key);
            if (!required && key === 'certificate') return null;
            const labels = { passport: 'Passport rasmi', selfie: 'Selfie (passport bilan)', certificate: 'Sertifikat' };
            return (
              <div key={key}>
                <Label className="text-sm">{labels[key]} {required && <span className="text-destructive">*</span>}</Label>
                <label className="mt-1.5 flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{files[key]?.name || 'Faylni tanlang yoki rasm yuklang'}</span>
                  <input type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={e => setFiles({ ...files, [key]: e.target.files?.[0] })} />
                  {files[key] && <CheckCircle2 className="h-4 w-4 text-success ml-auto" />}
                </label>
              </div>
            );
          })}

          <Button className="w-full rounded-xl btn-hero" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
            Tasdiqlashga yuborish
          </Button>
          <p className="text-[11px] text-muted-foreground">🔒 Sizning hujjatlaringiz xavfsiz saqlanadi va faqat admin ko'radi.</p>
        </div>
      )}
    </div>
  );
}
