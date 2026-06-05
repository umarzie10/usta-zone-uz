import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubStatus {
  tier: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  expires_at: string | null;
  days_left: number | null;
  active: boolean;
  audience: string;
  expired: boolean;
}

export function useSubscriptionStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) { setStatus(null); setLoading(false); return; }
    const { data } = await supabase.rpc('get_my_subscription_status');
    setStatus(data as unknown as SubStatus);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  return { status, loading, refresh };
}
