import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, Loader2, Sparkles, Clock } from 'lucide-react';
import {
  MASTER_PLANS, CLIENT_PLANS, BILLING_OPTIONS, formatSom,
  type BillingMonths, type MasterTier, type ClientTier
} from '@/lib/subscriptionPlans';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

type Audience = 'master' | 'client';

export default function Subscription() {
  const { user, profile } = useAuth();
  const { showNotification } = useApp();
  const navigate = useNavigate();
  const { status, refresh } = useSubscriptionStatus();

  const defaultAudience: Audience = profile?.role === 'master' ? 'master' : 'client';
  const [audience, setAudience] = useState<Audience>(defaultAudience);
  const [months, setMonths] = useState<BillingMonths>(1);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => { setAudience(profile?.role === 'master' ? 'master' : 'client'); }, [profile?.role]);

  const plans = audience === 'master' ? MASTER_PLANS : CLIENT_PLANS;
  const currentTier = status?.tier;

  const activate = async (tier: MasterTier | ClientTier) => {
    if (!user) { navigate('/login'); return; }
    setActivating(tier);
    try {
      const { data, error } = await supabase.rpc('activate_subscription', {
        _tier: tier,
        _months: months,
      });
      if (error) throw error;
      if (!(data as any)?.ok) throw new Error('Faollashtirib bo‘lmadi');
      showNotification('success', `${tier.toUpperCase()} tarifi ${months} oyga faollashtirildi`);
      await refresh();
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setActivating(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8 reveal">
          <h1 className="text-3xl sm:text-5xl font-black mb-3">Obuna tarifi</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Sizga mos tarifni tanlang — ko‘proq imkoniyat, ko‘proq daromad
          </p>
        </div>

        {/* Trial status banner */}
        {status?.is_trial && (
          <div className="max-w-2xl mx-auto mb-6 card-premium p-4 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">
                  ⏳ Bepul PRO sinov muddati — {status.days_left} kun qoldi
                </p>
                <p className="text-xs text-muted-foreground">
                  Sinov tugagandan keyin obuna sotib olishingiz kerak
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Audience tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 rounded-2xl bg-muted">
            {(['master', 'client'] as Audience[]).map(a => (
              <button key={a} onClick={() => setAudience(a)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${audience === a ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {a === 'master' ? '🛠 Usta tariflari' : '👤 Mijoz tariflari'}
              </button>
            ))}
          </div>
        </div>

        {/* Billing period */}
        <div className="flex justify-center mb-8 flex-wrap gap-2">
          {BILLING_OPTIONS.map(opt => (
            <button key={opt.months} onClick={() => setMonths(opt.months)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border-2 ${
                months === opt.months
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              }`}>
              {opt.label}
              {opt.discount && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-bold">
                  {opt.discount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map(plan => {
            const isCurrent = plan.id === currentTier;
            const price = plan.prices[months];
            return (
              <div key={plan.id}
                className={`relative card-premium p-6 border-2 transition reveal ${
                  plan.popular ? 'border-primary md:scale-105 shadow-2xl' : 'border-border hover:border-primary/40'
                }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Mashhur tanlov
                  </div>
                )}
                <div className="text-3xl mb-2">{plan.icon}</div>
                <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                <div className="text-[11px] font-semibold text-muted-foreground mb-3">{plan.badge}</div>
                <div className="mb-5">
                  <span className="text-3xl font-black">{formatSom(price)}</span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground"> so‘m / {months} oy</span>
                  )}
                </div>
                <ul className="space-y-2 mb-6 min-h-[200px]">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-xl ${plan.popular ? 'btn-hero' : ''}`}
                  variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'secondary'}
                  disabled={isCurrent || activating === plan.id}
                  onClick={() => activate(plan.id)}>
                  {activating === plan.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : isCurrent
                      ? 'Joriy tarif'
                      : price === 0 ? 'Bepul foydalanish' : 'Tanlash'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8 space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            To'lovlar Click, Payme va Uzum orqali qabul qilinadi
          </p>
          <p className="text-[11px] text-muted-foreground">
            Test rejimida tarif darhol faollashadi. Yangi ustalarga 30 kun, yangi mijozlarga 7 kun bepul PRO
          </p>
        </div>
      </div>
    </Layout>
  );
}
