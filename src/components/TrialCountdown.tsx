import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock } from 'lucide-react';
import { SubStatus } from '@/hooks/useSubscriptionStatus';

interface Props {
  status: SubStatus | null;
  audience?: 'master' | 'client';
}

/**
 * Top banner shown while a user is on the free trial.
 * Shows N days remaining with a CTA to subscribe.
 */
export default function TrialCountdown({ status, audience = 'master' }: Props) {
  const navigate = useNavigate();
  if (!status || !status.is_trial || status.days_left == null) return null;

  const days = status.days_left;
  const isUrgent = days <= 5;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 mb-5 border-2 ${
        isUrgent
          ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent'
          : 'border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent'
      }`}
    >
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${isUrgent ? 'bg-amber-500/20 text-amber-600' : 'bg-primary/20 text-primary'}`}>
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-bold leading-tight">
              ⏳ Bepul PRO {audience === 'master' ? 'davri' : 'sinov muddati'} tugashiga{' '}
              <span className={isUrgent ? 'text-amber-600' : 'text-primary'}>{days} kun</span> qoldi
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {audience === 'master'
                ? 'Sinov tugagandan keyin obuna kerak — yo‘qsa buyurtma qabul qila olmaysiz.'
                : 'PRO imkoniyatlarini saqlab qolish uchun obuna sotib oling.'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/subscription')}
          className="rounded-xl btn-hero shrink-0 gap-1.5"
          size="sm"
        >
          <Sparkles className="h-4 w-4" />
          Obunani xarid qilish
        </Button>
      </div>
    </div>
  );
}
