import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, X, Lock, LayoutDashboard, Crown } from 'lucide-react';

/**
 * Sticky top banner for masters:
 *  - While on PRO trial: shows days left (dismissable once per user+trial end date)
 *  - When trial/subscription expired: shows blocking CTA "Obunani xarid qiling"
 *    + dashboardga qaytish tugmasi. Bu holatda yopib bo'lmaydi.
 *  - Auto-refreshes every hour and at midnight so kun soni o'zgaradi.
 *  - To'liq light/dark mode moslashuvi semantik design tokenlar orqali.
 */
export default function FirstLoginTrialBanner() {
  const navigate = useNavigate();
  const { user, isMaster } = useAuth();
  const { status, refresh } = useSubscriptionStatus();
  const [dismissed, setDismissed] = useState(false);
  const [, setTick] = useState(0);

  // Per-user + per trial-end storage key — banner won't leak to another master.
  const storageKey =
    user && status?.trial_ends_at
      ? `usta_trial_banner_seen::${user.id}::${status.trial_ends_at}`
      : '';

  // Restore dismissed state when key changes
  useEffect(() => {
    if (!storageKey) { setDismissed(false); return; }
    setDismissed(localStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  // Auto-refresh: every hour re-fetch status, and re-render at next midnight
  useEffect(() => {
    if (!user || !isMaster) return;
    const hourly = setInterval(() => { refresh(); setTick(t => t + 1); }, 60 * 60 * 1000);

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 5, 0);
    const msToMidnight = nextMidnight.getTime() - now.getTime();
    const midnightTimer = setTimeout(() => {
      refresh();
      setTick(t => t + 1);
    }, msToMidnight);

    return () => { clearInterval(hourly); clearTimeout(midnightTimer); };
  }, [user?.id, isMaster, refresh]);

  if (!user || !isMaster || !status) return null;

  const isTrial = !!status.is_trial && status.days_left != null;
  const isExpired =
    status.audience === 'master' &&
    ((status.expired && !status.is_trial) ||
      (status.tier === 'free' && !status.is_trial));

  if (!isTrial && !isExpired) return null;

  // EXPIRED mode — not dismissable
  if (isExpired) {
    return (
      <div className="sticky top-16 z-40 w-full border-b border-destructive/30 bg-destructive/10 backdrop-blur-md supports-[backdrop-filter]:bg-destructive/10 dark:bg-destructive/15">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 sm:gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center">
            <Lock className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight text-foreground truncate">
              PRO sinov muddati tugadi
            </p>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Buyurtma qabul qilish uchun obunani sotib oling.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/subscription')}
            className="rounded-xl btn-hero gap-1.5 shrink-0"
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Obunani xarid qilish</span>
            <span className="sm:hidden">Obuna</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/dashboard/master')}
            className="rounded-xl gap-1.5 shrink-0 hidden xs:inline-flex sm:inline-flex"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Kabinet</span>
          </Button>
        </div>
      </div>
    );
  }

  // TRIAL mode — dismissable
  if (dismissed) return null;

  const days = status.days_left as number;
  const isUrgent = days <= 5;

  const dismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, '1');
    setDismissed(true);
  };

  return (
    <div
      className={`sticky top-16 z-40 w-full border-b backdrop-blur-md supports-[backdrop-filter]:bg-background/70 ${
        isUrgent
          ? 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15'
          : 'border-primary/25 bg-primary/10 dark:bg-primary/15'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 sm:gap-3">
        <div
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
            isUrgent
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'bg-primary/20 text-primary'
          }`}
        >
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight text-foreground truncate">
            ⏳ PRO sinov tugashiga{' '}
            <span
              className={
                isUrgent
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-primary'
              }
            >
              {days} kun
            </span>{' '}
            qoldi
          </p>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Sinov tugagandan keyin buyurtma qabul qilish uchun obuna kerak.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { dismiss(); navigate('/subscription'); }}
          className="rounded-xl btn-hero gap-1.5 shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Obunani ko‘rish</span>
          <span className="sm:hidden">Tariflar</span>
        </Button>
        <button
          onClick={dismiss}
          aria-label="Yopish"
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
