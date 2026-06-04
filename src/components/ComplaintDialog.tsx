import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

const CATEGORIES = ['spam', 'firibgar', 'sifatsiz_ish', 'qopol_muomala', 'boshqa'];
const LABELS: Record<string, string> = {
  spam: 'Spam', firibgar: 'Firibgarlik', sifatsiz_ish: 'Sifatsiz ish',
  qopol_muomala: "Qo'pol muomala", boshqa: 'Boshqa',
};

interface Props { targetUserId?: string; targetOrderId?: string; open: boolean; onClose: () => void; }

export default function ComplaintDialog({ targetUserId, targetOrderId, open, onClose }: Props) {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const [category, setCategory] = useState('boshqa');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) { showNotification('error', 'Avval tizimga kiring'); return; }
    if (description.trim().length < 10) { showNotification('error', 'Kamida 10 ta belgi yozing'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('complaints').insert({
      reporter_id: user.id, target_user_id: targetUserId || null,
      target_order_id: targetOrderId || null, category, description,
    });
    setSubmitting(false);
    if (error) { showNotification('error', error.message); return; }
    showNotification('success', 'Shikoyat yuborildi. Admin tez orada ko\'rib chiqadi.');
    setDescription(''); setCategory('boshqa'); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Shikoyat yuborish
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">Sabab</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`p-2.5 rounded-xl border-2 text-xs font-bold transition ${category === c ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  {LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm">Izoh</Label>
            <Textarea className="rounded-xl mt-1.5" rows={4} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Nima sodir bo'lganini batafsil yozing..." />
          </div>
          <Button className="w-full rounded-xl btn-hero" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Yuborish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
