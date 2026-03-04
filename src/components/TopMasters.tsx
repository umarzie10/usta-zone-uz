import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MapPin, CheckCircle, ChevronRight, Briefcase, Crown } from 'lucide-react';

interface TopMaster {
  id: string;
  user_id: string;
  rating: number;
  reviews_count: number;
  jobs_completed: number;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  is_verified: boolean;
  skills: string[];
}

export default function TopMasters() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [masters, setMasters] = useState<TopMaster[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopMasters();
  }, []);

  const fetchTopMasters = async () => {
    const [{ data: mps }, { count }] = await Promise.all([
      supabase
        .from('master_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('rating', { ascending: false })
        .limit(3),
      supabase.from('master_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    setTotalCount(count || 0);

    if (!mps || mps.length === 0) { setMasters([]); setLoading(false); return; }

    const userIds = mps.map(m => m.user_id);
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url, city, is_verified').in('user_id', userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    setMasters(mps.map(mp => {
      const p = pMap.get(mp.user_id);
      return {
        id: mp.id, user_id: mp.user_id,
        rating: mp.rating || 0, reviews_count: mp.reviews_count || 0,
        jobs_completed: mp.jobs_completed || 0,
        skills: mp.skills || [],
        full_name: p?.full_name || 'Unknown',
        avatar_url: p?.avatar_url, city: p?.city,
        is_verified: p?.is_verified || false,
      };
    }));
    setLoading(false);
  };

  const medals = ['🥇', '🥈', '🥉'];

  if (loading) {
    return (
      <section className="section-padding bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </div>
      </section>
    );
  }

  if (masters.length === 0) {
    return (
      <section className="section-padding bg-muted/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-3">{t('topMasters')}</h2>
          <p className="text-muted-foreground mb-6">{t('bestRatedMasters')}</p>
          <Button className="rounded-xl gap-2" onClick={() => navigate('/find-master')}>
            {t('findMaster')} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-muted/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium mb-3">
            <Crown className="h-4 w-4" /> TOP ustalar
          </div>
          <h2 className="text-3xl font-black">{t('topMasters')}</h2>
          <p className="text-muted-foreground mt-1">{t('bestRatedMasters')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {masters.map((master, i) => (
            <div
              key={master.id}
              onClick={() => navigate(`/master/${master.id}`)}
              className="card-premium p-5 hover-lift cursor-pointer animate-fade-in-up relative overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Medal */}
              <div className="absolute top-3 right-3 text-2xl">{medals[i]}</div>

              <div className="flex items-center gap-4 mb-4">
                <img
                  src={master.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(master.full_name)}&background=6366f1&color=fff&size=128`}
                  alt={master.full_name}
                  className="w-16 h-16 rounded-2xl object-cover shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-bold text-base truncate">{master.full_name}</h3>
                    {master.is_verified && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }, (_, j) => (
                      <Star key={j} className={`h-3.5 w-3.5 ${j < Math.floor(master.rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                    ))}
                    <span className="text-xs font-bold text-amber-500 ml-1">{master.rating.toFixed(1)}</span>
                  </div>
                  {master.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {master.city}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 text-sm">
                <div className="text-center flex-1">
                  <p className="font-bold">{master.jobs_completed}</p>
                  <p className="text-[10px] text-muted-foreground">Bajarilgan</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center flex-1">
                  <p className="font-bold">{master.reviews_count}</p>
                  <p className="text-[10px] text-muted-foreground">Sharhlar</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalCount > 3 && (
          <div className="text-center mt-6">
            <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate('/masters')}>
              Barcha ustalarni ko'rish ({totalCount}) <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
