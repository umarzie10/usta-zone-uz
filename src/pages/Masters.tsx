import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ReviewForm from '@/components/ReviewForm';
import { Star, MapPin, CheckCircle, Phone, MessageCircle, Briefcase } from 'lucide-react';

interface MasterItem {
  id: string;
  user_id: string;
  rating: number;
  reviews_count: number;
  jobs_completed: number;
  experience_years: number;
  skills: string[];
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  phone: string | null;
  is_verified: boolean;
}

export default function MastersPage() {
  const { t } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [masters, setMasters] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<{ masterId: string; orderId: string } | null>(null);

  useEffect(() => { fetchMasters(); }, []);

  const fetchMasters = async () => {
    setLoading(true);
    const { data: mps } = await supabase
      .from('master_profiles')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (!mps || mps.length === 0) { setMasters([]); setLoading(false); return; }

    const userIds = mps.map(m => m.user_id);
    const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    setMasters(mps.map(mp => {
      const p = pMap.get(mp.user_id);
      return {
        id: mp.id, user_id: mp.user_id,
        rating: mp.rating || 0, reviews_count: mp.reviews_count || 0,
        jobs_completed: mp.jobs_completed || 0, experience_years: mp.experience_years || 0,
        skills: mp.skills || [],
        full_name: p?.full_name || 'Unknown', avatar_url: p?.avatar_url,
        city: p?.city, phone: p?.phone, is_verified: p?.is_verified || false,
      };
    }));
    setLoading(false);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="hero-bg py-12 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-black mb-3 animate-fade-in-up">{t('allMastersPage')}</h1>
          <p className="text-white/80 text-lg animate-fade-in-up delay-100">{t('allMastersDesc')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-muted-foreground text-sm mb-6">
          <span className="font-semibold text-foreground">{loading ? '...' : masters.length}</span> {t('mastersFound')}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-premium p-5 space-y-4">
                <div className="flex gap-3"><Skeleton className="w-16 h-16 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {masters.map((master, i) => (
              <div key={master.id} className="card-premium p-5 hover-lift animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex gap-3 mb-4">
                  <img
                    src={master.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(master.full_name)}&background=6366f1&color=fff&size=128`}
                    alt={master.full_name}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm leading-tight truncate">{master.full_name}</h3>
                      {master.is_verified && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {renderStars(master.rating)}
                      <span className="text-xs font-semibold text-amber-500">{master.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({master.reviews_count})</span>
                    </div>
                    {master.city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{master.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-xl bg-muted/50">
                  <div className="text-center">
                    <p className="text-sm font-bold">{master.jobs_completed}</p>
                    <p className="text-[10px] text-muted-foreground">{t('completedJobs')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">{master.experience_years} yil</p>
                    <p className="text-[10px] text-muted-foreground">{t('experienceLabel')}</p>
                  </div>
                </div>

                {master.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {master.skills.slice(0, 3).map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px] py-0 px-2">{s}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 rounded-xl text-xs gap-1.5"
                    onClick={() => navigate(`/master/${master.id}`)}>
                    {t('viewProfile')}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5"
                    onClick={() => {
                      if (!user) { navigate('/login'); return; }
                      setReviewTarget({ masterId: master.user_id, orderId: '' });
                    }}>
                    <Star className="h-3.5 w-3.5" /> {t('rateBtn')}
                  </Button>
                </div>

                <div className="flex gap-2 mt-2">
                  {master.phone && (
                    <a href={`tel:${master.phone}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full rounded-xl text-xs gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> {t('callMaster')}
                      </Button>
                    </a>
                  )}
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs gap-1.5"
                    onClick={() => navigate(`/master/${master.id}`)}>
                    <MessageCircle className="h-3.5 w-3.5" /> {t('message')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewForm
          masterId={reviewTarget.masterId}
          orderId={reviewTarget.orderId}
          open={true}
          onClose={() => setReviewTarget(null)}
          onSubmitted={fetchMasters}
        />
      )}
    </Layout>
  );
}
