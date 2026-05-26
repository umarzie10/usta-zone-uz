import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, Crown, Zap, Star, Loader2, Sparkles } from 'lucide-react';

type Tier = 'free' | 'pro' | 'premium';

const TIERS = [
  {
    id: 'free' as Tier,
    name: 'Free',
    price: 0,
    badge: '🪪 Yangi Usta',
    color: 'border-border',
    icon: Star,
    iconColor: 'text-muted-foreground',
    features: ['Oddiy profil', 'Maks 3 ta xizmat', 'Qidiruvda pastroq', 'Oddiy ranking'],
  },
  {
    id: 'pro' as Tier,
    name: 'Pro',
    price: 99000,
    badge: '⭐ Verified Pro',
    popular: true,
    color: 'border-primary',
    icon: Zap,
    iconColor: 'text-primary',
    features: ['Qidiruvda yuqori', 'Cheksiz xizmat', 'Chatda ustunlik', 'Portfolio rasmlari', 'Oddiy analytics'],
  },
  {
    id: 'premium' as Tier,
    name: 'Premium',
    price: 199000,
    badge: '🏆 Top Usta / Elite',
    color: 'border-amber-500',
    icon: Crown,
    iconColor: 'text-amber-500',
    features: ['Eng yuqori pozitsiya', 'Featured (kategoriya tepasi)', 'Instant booking', 'AI matching ustunlik', 'Kengaytirilgan analytics', 'Reklama & boost'],
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const navigate = useNavigate();
  const [current, setCurrent] = useState<Tier>('free');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<Tier | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('subscriptions').select('tier').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setCurrent(data.tier as Tier);
        setLoading(false);
      });
  }, [user]);

  const handleActivate = async (tier: Tier) => {
    if (!user) { navigate('/login'); return; }
    if (tier === current) return;
    setActivating(tier);
    try {
      const expiresAt = tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        tier,
        expires_at: expiresAt,
      }, { onConflict: 'user_id' });
      if (error) throw error;
      setCurrent(tier);
      showNotification('success', `${tier.toUpperCase()} tarifi faollashtirildi`);
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setActivating(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-5xl font-black mb-3">Tarif tanlang</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Ko'proq buyurtma oling, ko'proq daromad qiling</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {TIERS.map(tier => {
              const Icon = tier.icon;
              const isCurrent = tier.id === current;
              return (
                <div key={tier.id}
                  className={`relative card-premium p-6 border-2 ${tier.color} ${tier.popular ? 'lg:scale-105 shadow-2xl' : ''}`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Mashhur
                    </div>
                  )}
                  <Icon className={`h-8 w-8 ${tier.iconColor} mb-3`} />
                  <h3 className="text-2xl font-black mb-1">{tier.name}</h3>
                  <div className="text-[11px] font-semibold text-muted-foreground mb-2">{tier.badge}</div>
                  <div className="mb-5">
                    <span className="text-3xl font-black">{tier.price === 0 ? 'Bepul' : `${(tier.price / 1000).toFixed(0)}k`}</span>
                    {tier.price > 0 && <span className="text-sm text-muted-foreground"> /oy</span>}
                  </div>
                  <ul className="space-y-2.5 mb-6 min-h-[180px]">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-xl ${isCurrent ? '' : tier.popular ? 'btn-hero' : ''}`}
                    variant={isCurrent ? 'outline' : tier.popular ? 'default' : 'secondary'}
                    disabled={isCurrent || activating === tier.id}
                    onClick={() => handleActivate(tier.id)}>
                    {activating === tier.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                      isCurrent ? 'Joriy tarif' : 'Tanlash'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          To'lovlar Click, Payme va Uzum orqali qabul qilinadi. Test rejimida tarif darhol faollashadi.
        </p>
      </div>
    </Layout>
  );
}
