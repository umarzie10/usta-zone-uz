import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

interface MasterStatusToggleProps {
  userId: string;
  initialAvailable?: boolean;
  onChange?: (available: boolean) => void;
}

export default function MasterStatusToggle({ userId, initialAvailable = false, onChange }: MasterStatusToggleProps) {
  const { showNotification } = useApp();
  const [available, setAvailable] = useState(!!initialAvailable);
  const [saving, setSaving] = useState(false);

  useEffect(() => setAvailable(!!initialAvailable), [initialAvailable]);

  const setStatus = async (next: boolean) => {
    if (saving || next === available) return;
    setSaving(true);
    const prev = available;
    setAvailable(next);
    const { error } = await supabase
      .from('master_profiles')
      .update({ is_available: next })
      .eq('user_id', userId);
    setSaving(false);
    if (error) {
      setAvailable(prev);
      showNotification('error', error.message);
      return;
    }
    onChange?.(next);
    showNotification('success', next ? "Statusingiz: BO'SH" : 'Statusingiz: BAND');
  };

  return (
    <div className="card-premium p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-sm">Ish holati</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {available
              ? "Mijozlar sizni BO'SH deb ko'rmoqda — yangi buyurtma qabul qilasiz"
              : 'Mijozlar sizni BAND deb ko\'rmoqda — yangi buyurtma kelmaydi'}
          </p>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1.5">
        <button
          type="button"
          aria-pressed={available}
          onClick={() => setStatus(true)}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-300 ${
            available
              ? 'bg-success text-success-foreground shadow-md scale-[1.01]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${available ? 'bg-success-foreground' : 'bg-success'}`} />
          BO'SH
        </button>
        <button
          type="button"
          aria-pressed={!available}
          onClick={() => setStatus(false)}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-300 ${
            !available
              ? 'bg-destructive text-destructive-foreground shadow-md scale-[1.01]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${!available ? 'bg-destructive-foreground' : 'bg-destructive'}`} />
          BAND
        </button>
      </div>
    </div>
  );
}
