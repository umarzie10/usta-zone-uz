import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Crown } from 'lucide-react';
import { SubStatus } from '@/hooks/useSubscriptionStatus';

interface Props {
  status: SubStatus | null;
  children: ReactNode;
  /** When true (default for masters), expired masters cannot see content. */
  blockOnExpired?: boolean;
}

/**
 * Wraps master-only content. When the subscription has expired (no trial,
 * no active paid plan), the children are hidden and a paywall is shown.
 */
export default function SubscriptionGuard({ status, children, blockOnExpired = true }: Props) {
  const navigate = useNavigate();

  const expired = !!status && status.expired && !status.is_trial;
  // Master tier 'free' (no trial, no paid plan) also counts as blocked
  const blocked = blockOnExpired && status && status.audience === 'master' && (expired || (status.tier === 'free' && !status.is_trial));

  if (!blocked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-md opacity-30">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="card-premium max-w-md w-full p-6 sm:p-8 text-center border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-primary/10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black mb-2">Obuna muddati tugadi</h2>
          <p className="text-muted-foreground text-sm mb-5">
            Profilingiz va buyurtmalar uchun obuna kerak. Yaxshi tarifni tanlang —
            mijozlarga ko‘rinishni davom ettiring.
          </p>
          <div className="flex flex-col gap-2.5">
            <Button onClick={() => navigate('/subscription')} className="w-full rounded-xl btn-hero gap-2">
              <Crown className="h-4 w-4" /> Obunani xarid qilish
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full rounded-xl">
              Bosh sahifa
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3" /> BASIC tarif atigi 19 000 so‘m/oy
          </p>
        </div>
      </div>
    </div>
  );
}
