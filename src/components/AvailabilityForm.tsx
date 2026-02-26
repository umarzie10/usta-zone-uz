import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, Trash2, Loader2 } from 'lucide-react';

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export default function AvailabilityForm({ masterProfileId }: { masterProfileId: string }) {
  const { t, showNotification } = useApp();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [masterProfileId]);

  const fetchSlots = async () => {
    const { data } = await supabase
      .from('master_availability')
      .select('*')
      .eq('master_id', masterProfileId)
      .order('day_of_week');
    setSlots(data || []);
    setLoading(false);
  };

  const addSlot = () => {
    const usedDays = slots.map(s => s.day_of_week);
    const nextDay = [1, 2, 3, 4, 5, 6, 0].find(d => !usedDays.includes(d)) ?? 1;
    setSlots([...slots, { day_of_week: nextDay, start_time: '09:00', end_time: '18:00', is_active: true }]);
  };

  const removeSlot = async (index: number) => {
    const slot = slots[index];
    if (slot.id) {
      await supabase.from('master_availability').delete().eq('id', slot.id);
    }
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    setSlots(slots.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Delete existing
      await supabase.from('master_availability').delete().eq('master_id', masterProfileId);
      // Insert all
      if (slots.length > 0) {
        const { error } = await supabase.from('master_availability').insert(
          slots.map(s => ({
            master_id: masterProfileId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            is_active: s.is_active,
          }))
        );
        if (error) throw error;
      }
      showNotification('success', t('scheduleSaved'));
      fetchSlots();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {t('workSchedule')}
        </h3>
        <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={addSlot} disabled={slots.length >= 7}>
          <Plus className="h-4 w-4" /> {t('addSchedule')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t('workScheduleDesc')}</p>

      {slots.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">{t('noData')}</div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <Switch checked={slot.is_active} onCheckedChange={v => updateSlot(i, 'is_active', v)} />
              <select
                value={slot.day_of_week}
                onChange={e => updateSlot(i, 'day_of_week', parseInt(e.target.value))}
                className="bg-background border border-input rounded-lg px-3 py-2 text-sm font-medium min-w-[130px]"
              >
                {DAY_KEYS.map((key, idx) => (
                  <option key={idx} value={idx}>{t(key as any)}</option>
                ))}
              </select>
              <Input
                type="time"
                value={slot.start_time}
                onChange={e => updateSlot(i, 'start_time', e.target.value)}
                className="w-28 rounded-lg h-9"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="time"
                value={slot.end_time}
                onChange={e => updateSlot(i, 'end_time', e.target.value)}
                className="w-28 rounded-lg h-9"
              />
              <Button size="icon" variant="ghost" className="shrink-0 text-destructive hover:text-destructive" onClick={() => removeSlot(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button className="w-full rounded-xl btn-hero" onClick={saveAll} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {t('save')}
      </Button>
    </div>
  );
}
