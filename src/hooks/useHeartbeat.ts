import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Pings profiles.last_seen_at every 45s while user is logged in.
 * A user is considered "online" if last_seen_at is within the last 90 seconds.
 */
export function useHeartbeat() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const ping = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } catch {
        // silent
      }
    };

    ping();
    const interval = setInterval(ping, 45_000);
    const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user]);
}
