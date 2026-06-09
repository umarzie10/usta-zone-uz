import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, X } from 'lucide-react';

/**
 * Shown ONCE per master after first sign-in: a top page banner
 * displaying how many days are left on the free PRO trial.
 * Dismiss state is stored per-user in localStorage.
 */
export default function FirstLoginTrialBanner() {
  const navigate = useNavigate();
  const { user, isMaster } = useAuth();
  const { status } = useSubscriptionStatus();
  const [visible, setVisible] = useState(false);

  const storageKey = user ? `usta_trial_banner_seen_${user.id}` : '';

  useEffect(() => {
    if (!user || !isMaster || !storageKey) return;
    if (!status?.is_trial || status.days_left == null) return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) setVisible(true);
  }, [user, isMaster, status?.is_trial, status?.days_left, storageKey]);

  if (!visible || !status || !status.is_trial || status.days_left == null) return null;

  const dismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, '1');
    setVisible(false);
  };

  const days = status.days_left;
  const isUrgent = days <= 5;

  return (
    <div
      className={`w-full border-b ${
        isUrgent
          ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-amber-500/30'
          : 'bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border-primary/20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <div
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
            isUrgent ? 'bg-amber-500/20 text-amber-600' : 'bg-primary/20 text-primary'
          }`}
        >
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            ⏳ Bepul PRO sinov muddati tugashiga{' '}
            <span className={isUrgent ? 'text-amber-600' : 'text-primary'}>{days} kun</span> qoldi
          </p>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Sinov tugagandan keyin buyurtmalarni qabul qilish uchun obuna kerak bo‘ladi.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-xl btn-hero gap-1.5 shrink-0"
          onClick={() => {
            dismiss();
            navigate('/subscription');
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Obunani ko‘rish</span>
          <span className="sm:hidden">Tariflar</span>
        </Button>
        <button
          onClick={dismiss}
          aria-label="Yopish"
          className="shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
