import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, Loader2, Sparkles, Clock, ShieldAlert } from 'lucide-react';
import { BILLING_OPTIONS, formatSom, type BillingMonths } from '@/lib/subscriptionPlans';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

/**
 * Subscription page — locked to the user's role:
 * - Masters see ONLY master plans
 * - Clients see ONLY client plans
 * - Admins/guests see master plans by default (no toggle needed for end users)
 */
export default function Subscription() {
  const { user, profile, isAdmin } = useAuth();
  const { showNotification } = useApp();
  const navigate = useNavigate();
  const { status, refresh } = useSubscriptionStatus();

  // Role-based audience — no UI toggle for clients/masters.
  const audience: 'master' | 'client' =
    profile?.role === 'master' ? 'master' :
    profile?.role === 'client' ? 'client' : 'master';

  const { plans, loading: plansLoading } = useSubscriptionPlans(audience);

  const [months, setMonths] = useState<BillingMonths>(1);
  const [activating, setActivating] = useState<string | null>(null);

  const currentTier = status?.tier;
  const priceFor = (p: any) => (months === 1 ? p.price_1m : months === 3 ? p.price_3m : months === 6 ? p.price_6m : p.price_12m);

  const activate = async (tier: string) => {
    if (!user) { navigate('/login'); return; }
    setActivating(tier);
    try {
      const { data, error } = await supabase.rpc('activate_subscription', {
        _tier: tier as any,
        _months: months,
      });
      if (error) throw error;
      if (!(data as any)?.ok) throw new Error('Faollashtirib bo\'lmadi');
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
          <h1 className="text-3xl sm:text-5xl font-black mb-3">
            {audience === 'master' ? 'Usta tariflari' : 'Mijoz tariflari'}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            {audience === 'master'
              ? 'Ko\'proq buyurtma — ko\'proq daromad uchun mos tarifni tanlang'
              : 'Premium imkoniyatlar bilan tezroq xizmat oling'}
          </p>
        </div>

        {/* Trial banner */}
        {status?.is_trial && (
          <div className="max-w-2xl mx-auto mb-6 card-premium p-4 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">⏳ Bepul PRO sinov muddati — {status.days_left} kun qoldi</p>
                <p className="text-xs text-muted-foreground">Sinov tugagandan keyin obuna sotib olishingiz kerak</p>
              </div>
            </div>
          </div>
        )}

        {/* Expired banner */}
        {audience === 'master' && status && status.expired && !status.is_trial && (
          <div className="max-w-2xl mx-auto mb-6 card-premium p-4 border-2 border-destructive/30 bg-destructive/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Obuna muddati tugadi</p>
                <p className="text-xs text-muted-foreground">Buyurtmalarni qabul qilish uchun tarifni faollashtiring</p>
              </div>
            </div>
          </div>
        )}

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

        {plansLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : plans.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">Hozircha tariflar mavjud emas</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map(plan => {
              const isCurrent = plan.tier === currentTier;
              const price = priceFor(plan);
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
                    {price > 0 && <span className="text-sm text-muted-foreground"> so'm / {months} oy</span>}
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
                    disabled={isCurrent || activating === plan.tier}
                    onClick={() => activate(plan.tier)}>
                    {activating === plan.tier
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : isCurrent ? 'Joriy tarif' : price === 0 ? 'Bepul foydalanish' : 'Tanlash'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8 space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            To'lovlar Click, Payme va Uzum orqali qabul qilinadi
          </p>
          {isAdmin && (
            <p className="text-[11px] text-muted-foreground">
              Admin sifatida tariflarni Admin Panel → "Tariflar" bo'limidan boshqarishingiz mumkin
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
