import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ChatDialog from '@/components/ChatDialog';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star, MapPin, CheckCircle, Phone, MessageCircle, Calendar,
  Briefcase, Clock, ArrowLeft, Share2, Heart, Image, X
} from 'lucide-react';

interface MasterData {
  id: string;
  user_id: string;
  rating: number;
  reviews_count: number;
  jobs_completed: number;
  experience_years: number;
  bio: string | null;
  skills: string[];
  portfolio_urls: string[];
  category_ids: string[];
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  is_verified: boolean;
  category_names: string[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client_name: string;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAY_NAMES = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export default function MasterProfilePage() {
  const { id } = useParams();
  const { t } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [master, setMaster] = useState<MasterData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchMaster();
  }, [id]);

  const fetchMaster = async () => {
    setLoading(true);
    try {
      const { data: mp, error } = await supabase
        .from('master_profiles')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', mp.user_id)
        .single();

      // Fetch category names
      const catIds = mp.category_ids || [];
      let categoryNames: string[] = [];
      if (catIds.length > 0) {
        const { data: cats } = await supabase.from('categories').select('name_uz').in('id', catIds);
        categoryNames = cats?.map(c => c.name_uz) || [];
      }

      setMaster({
        id: mp.id,
        user_id: mp.user_id,
        rating: mp.rating || 0,
        reviews_count: mp.reviews_count || 0,
        jobs_completed: mp.jobs_completed || 0,
        experience_years: mp.experience_years || 0,
        bio: mp.bio,
        skills: mp.skills || [],
        portfolio_urls: mp.portfolio_urls || [],
        category_ids: catIds,
        category_names: categoryNames,
        full_name: profile?.full_name || 'Unknown',
        avatar_url: profile?.avatar_url,
        city: profile?.city,
        region: profile?.region,
        phone: profile?.phone,
        is_verified: profile?.is_verified || false,
      });

      // Fetch availability
      const { data: avail } = await supabase
        .from('master_availability')
        .select('day_of_week, start_time, end_time')
        .eq('master_id', mp.id)
        .eq('is_active', true)
        .order('day_of_week');
      setAvailability(avail || []);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('master_id', mp.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsData && reviewsData.length > 0) {
        const clientIds = reviewsData.map(r => r.client_id);
        const { data: clientProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', clientIds);
        const clientMap = new Map(clientProfiles?.map(p => [p.user_id, p.full_name]) || []);

        setReviews(reviewsData.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at || '',
          client_name: clientMap.get(r.client_id) || 'Mijoz',
        })));
      }
    } catch (err) {
      console.error('Error fetching master:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size = 'md') => {
    const sz = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${sz} ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
    ));
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-24 mb-6 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="card-premium p-6">
                <div className="flex gap-5">
                  <Skeleton className="w-28 h-28 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
              <Skeleton className="h-32 rounded-2xl" />
            </div>
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!master) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-2xl font-bold mb-3">{t('noMasterFound')}</h2>
          <Button onClick={() => navigate('/find-master')} className="rounded-xl">
            {t('findMaster')}
          </Button>
        </div>
      </Layout>
    );
  }

  const avatarUrl = master.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(master.full_name)}&background=6366f1&color=fff&size=128`;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-6 rounded-xl gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Main info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card-premium p-6">
              <div className="flex gap-5">
                <div className="relative shrink-0">
                  <img src={avatarUrl} alt={master.full_name}
                    className="w-28 h-28 rounded-2xl object-cover shadow-md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h1 className="text-2xl font-black">{master.full_name}</h1>
                    <Button variant="ghost" size="icon" className="rounded-xl shrink-0">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">{renderStars(master.rating, 'lg')}</div>
                    <span className="font-bold text-amber-500">{master.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">({master.reviews_count} {t('reviews')})</span>
                    {master.is_verified && (
                      <span className="badge-verified ml-1">
                        <CheckCircle className="h-3 w-3" /> {t('verified')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {master.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {master.city}{master.region ? `, ${master.region}` : ''}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {master.experience_years} {t('yearsExperience')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Briefcase, label: t('completedJobs'), value: master.jobs_completed },
                { icon: Star, label: t('averageRating'), value: master.rating.toFixed(1) },
                { icon: Clock, label: t('experienceYears'), value: master.experience_years },
              ].map(s => (
                <div key={s.label} className="card-premium p-4 text-center">
                  <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            {master.bio && (
              <div className="card-premium p-6">
                <h3 className="font-bold text-lg mb-3">{t('aboutMaster')}</h3>
                <p className="text-muted-foreground leading-relaxed">{master.bio}</p>
              </div>
            )}

            {/* Category */}
            {master.category_names.length > 0 && (
              <div className="card-premium p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" /> {t('categoryLabel')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {master.category_names.map(name => (
                    <Badge key={name} className="px-3 py-1.5 rounded-xl text-sm">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {master.skills.length > 0 && (
              <div className="card-premium p-6">
                <h3 className="font-bold text-lg mb-4">{t('skills')}</h3>
                <div className="flex flex-wrap gap-2">
                  {master.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1.5 rounded-xl text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Availability / Working Hours */}
            {availability.length > 0 && (
              <div className="card-premium p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> Ishlash vaqti
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availability.map((a, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-2.5">
                      <span className="font-medium text-sm">{DAY_NAMES[a.day_of_week]}</span>
                      <span className="text-sm text-primary font-semibold">
                        {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Gallery */}
            {master.portfolio_urls.length > 0 && (
              <div className="card-premium p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" /> Portfolio
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {master.portfolio_urls.map((url, i) => (
                    <button key={i} onClick={() => setLightboxImg(url)}
                      className="aspect-square rounded-xl overflow-hidden border border-border hover:opacity-80 transition-opacity">
                      <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card-premium p-6">
              <h3 className="font-bold text-lg mb-4">{t('reviewsTitle')} ({master.reviews_count})</h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, i) => (
                    <div key={review.id}>
                      {i > 0 && <Separator className="mb-4" />}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">{review.client_name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }, (_, j) => (
                              <Star key={j} className={`h-3 w-3 ${j < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t('noData')}</p>
              )}
            </div>
          </div>

          {/* Right - Contact */}
          <div className="space-y-4">
            <div className="card-premium p-6 sticky top-20">
              <div className="space-y-3">
                <Button
                  className="w-full h-12 rounded-xl btn-hero gap-2 text-base font-semibold"
                  onClick={() => navigate(`/order/create?master=${master.id}`)}
                >
                  <Calendar className="h-5 w-5" />
                  {t('hire')}
                </Button>

                {master.phone && (
                  <a href={`tel:${master.phone}`} className="block">
                    <Button variant="outline" className="w-full h-11 rounded-xl gap-2 font-semibold">
                      <Phone className="h-4 w-4" />
                      {t('callMaster')}
                    </Button>
                  </a>
                )}

                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl gap-2 font-semibold"
                  onClick={() => {
                    if (!user) { navigate('/login'); return; }
                    setChatOpen(true);
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('message')}
                </Button>

                <Button variant="ghost" className="w-full h-10 rounded-xl gap-2 text-sm">
                  <Share2 className="h-4 w-4" />
                  {t('share')}
                </Button>
              </div>

              <Separator className="my-5" />

              <div className="space-y-2.5 text-sm">
                {master.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('phoneLabel')}</span>
                    <span className="font-medium">{master.phone}</span>
                  </div>
                )}
                {master.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cityLabel')}</span>
                    <span className="font-medium">{master.city}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('experienceLabel')}</span>
                  <span className="font-medium">{master.experience_years} {t('yearsExperience')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('statusLabel')}</span>
                  <span className="text-success font-medium">{t('activeStatus')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxImg(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={lightboxImg} alt="Portfolio" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <ChatDialog
        receiverId={master.user_id}
        receiverName={master.full_name}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </Layout>
  );
}
