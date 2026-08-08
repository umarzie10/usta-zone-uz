import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  orderId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const ERR: Record<string, string> = {
  warranty_expired: 'Kafolat muddati (7 kun) tugagan.',
  not_found: 'Buyurtma topilmadi.',
};

export default function WarrantyClaimDialog({ orderId, open, onOpenChange }: Props) {
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      const path = `warranty/${orderId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '')}`;
      const { error } = await supabase.storage.from('portfolio').upload(path, file);
      if (!error) {
        urls.push(supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl);
      }
    }
    setPhotos((p) => [...p, ...urls]);
    setBusy(false);
  };

  const submit = async () => {
    const text = reason.trim();
    if (text.length < 10) { toast.error('Muammoni kamida 10 ta belgi bilan tavsiflang.'); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('create_warranty_claim', {
      _order_id: orderId, _reason: text.slice(0, 1000), _photos: photos,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const res = data as { ok?: boolean; error?: string };
    if (res?.ok) {
      toast.success('Kafolat murojaati yuborildi ✅');
      setReason(''); setPhotos([]); onOpenChange(false);
    } else {
      toast.error(ERR[res?.error || ''] || 'Xatolik yuz berdi');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Kafolat murojaati
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Ish yakunlangandan keyin 7 kun ichida muammo bo‘lsa, murojaat qoldiring. Admin ko‘rib chiqadi.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Muammoni batafsil yozing..."
          />
          <input type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)}
            className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2" />
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {photos.map((p) => (
                <img key={p} src={p} alt="Dalil rasmi" className="h-14 w-14 rounded-lg object-cover border border-border" />
              ))}
            </div>
          )}
          <Button onClick={submit} disabled={busy} className="w-full rounded-xl">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yuborish'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
