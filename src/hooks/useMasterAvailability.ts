import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Realtime map of master_profiles.id -> is_available.
 * Seeds from the initial rows, then listens to postgres UPDATE events so the
 * BO'SH / BAND badges refresh without a page reload.
 */
export function useMasterAvailability(
  initial: { id: string; is_available?: boolean | null }[],
) {
  const [availability, setAvailability] = useState<Record<string, boolean>>({});

  const seedKey = initial.map(m => `${m.id}:${m.is_available ? 1 : 0}`).join(',');

  useEffect(() => {
    setAvailability(
      Object.fromEntries(initial.map(m => [m.id, !!m.is_available])),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  useEffect(() => {
    const channel = supabase
      .channel('master-availability')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'master_profiles' },
        (payload: any) => {
          const row = payload.new;
          if (!row?.id) return;
          setAvailability(prev =>
            prev[row.id] === !!row.is_available
              ? prev
              : { ...prev, [row.id]: !!row.is_available },
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return availability;
}
