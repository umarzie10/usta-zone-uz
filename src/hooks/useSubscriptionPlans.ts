import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DbPlan {
  id: string;
  audience: 'master' | 'client';
  tier: string;
  name: string;
  icon: string;
  badge: string;
  popular: boolean;
  features: string[];
  price_1m: number;
  price_3m: number;
  price_6m: number;
  price_12m: number;
  is_active: boolean;
  order_num: number;
}

/**
 * Fetches subscription plans for a single audience (master/client).
 * Plans are admin-managed in the DB; UI auto-updates after admin changes.
 */
export function useSubscriptionPlans(audience: 'master' | 'client') {
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    setLoading(true);
    supabase
      .from('subscription_plans' as any)
      .select('*')
      .eq('audience', audience)
      .eq('is_active', true)
      .order('order_num')
      .then(({ data }) => {
        if (!on) return;
        setPlans((data as any[]) || []);
        setLoading(false);
      });
    return () => { on = false; };
  }, [audience]);

  return { plans, loading };
}
