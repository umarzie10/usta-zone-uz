import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Search, SlidersHorizontal, X, Star, MapPin, CheckCircle, Phone, MessageCircle, UserPlus } from 'lucide-react';
import { uzbekCities, uzbekRegions } from '@/lib/demoData';
import { categoryTree } from '@/lib/categoryTaxonomy';

interface RealMaster {
  id: string;
  user_id: string;
  rating: number;
  reviews_count: number;
  jobs_completed: number;
  experience_years: number;
  bio: string | null;
  skills: string[];
  category_ids: string[];
  is_approved: boolean;
  is_active: boolean;
  // from profiles join
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  is_verified: boolean;
}

interface DbCategory { id: string; name_uz: string; name_ru: string | null; name_en: string | null; parent_id: string | null; }

const ITEMS_PER_PAGE = 12;

export default function FindMasterPage() {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('all');
  const [region, setRegion] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(!!searchParams.get('category'));
  const [masters, setMasters] = useState<RealMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('category') || 'all');
  const [subcategory, setSubcategory] = useState<string>('all');

  // DB-driven categories (admin panel manages these). Subs = rows with parent_id === selected main.
  const subOptions = categoryId === 'all' ? [] : categories.filter(c => c.parent_id === categoryId);
  const catName = (c: DbCategory) =>
    lang === 'ru' ? (c.name_ru || c.name_uz) : lang === 'en' ? (c.name_en || c.name_uz) : c.name_uz;

  useEffect(() => {
    supabase.from('categories').select('id, name_uz, name_ru, name_en, parent_id').order('order_num')
      .then(({ data }) => setCategories((data as DbCategory[]) || []));
  }, []);


  useEffect(() => {
    fetchMasters();
  }, [city, region, sortBy, page]);

  const fetchMasters = async () => {
    setLoading(true);
    try {
      // Get total count
      const countQuery = supabase
        .from('master_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_approved', true);
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Fetch master profiles
      let query = supabase
        .from('master_profiles')
        .select('id,user_id,category_ids,skills,portfolio_urls,bio,experience_years,rating,reviews_count,jobs_completed,is_active,is_approved,verification_tier')
        .eq('is_active', true)
        .eq('is_approved', true);

      // Sort
      if (sortBy === 'rating') query = query.order('rating', { ascending: false });
      else if (sortBy === 'jobs') query = query.order('jobs_completed', { ascending: false });

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      const { data: masterProfiles, error } = await query;
      if (error) throw error;

      if (!masterProfiles || masterProfiles.length === 0) {
        setMasters([]);
        setLoading(false);
        return;
      }

      // Fetch corresponding profiles
      const userIds = masterProfiles.map(mp => mp.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id,full_name,avatar_url,city,region,is_verified,latitude,longitude')
        .in('user_id', userIds);
      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const combined: RealMaster[] = masterProfiles.map(mp => {
        const profile = profileMap.get(mp.user_id);
        return {
          id: mp.id,
          user_id: mp.user_id,
          rating: mp.rating || 0,
          reviews_count: mp.reviews_count || 0,
          jobs_completed: mp.jobs_completed || 0,
          experience_years: mp.experience_years || 0,
          bio: mp.bio,
          skills: mp.skills || [],
          category_ids: mp.category_ids || [],
          is_approved: mp.is_approved || false,
          is_active: mp.is_active || false,
          full_name: profile?.full_name || 'Unknown',
          avatar_url: profile?.avatar_url,
          city: profile?.city,
          region: profile?.region,
          phone: null,
          is_verified: profile?.is_verified || false,
        };
      });

      setMasters(combined);
    } catch (err) {
      console.error('Error fetching masters:', err);
      setMasters([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering for search, city, region, category, subcategory
  const filtered = masters.filter(m => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || m.full_name.toLowerCase().includes(q) ||
      m.skills.some(s => s.toLowerCase().includes(q)) ||
      (m.bio && m.bio.toLowerCase().includes(q));
    const matchCity = city === 'all' || m.city === city;
    const matchRegion = region === 'all' || m.region === region;
    const matchCategory = categoryId === 'all' || m.category_ids.includes(categoryId);
    const matchSub = subcategory === 'all' || m.skills.some(s => s.toLowerCase().includes(subcategory.toLowerCase()));
    return matchSearch && matchCity && matchRegion && matchCategory && matchSub;
  });

  const clearFilters = () => {
    setSearch('');
    setCity('all');
    setRegion('all');
    setSortBy('rating');
    setCategoryId('all');
    setSubcategory('all');
    setPage(1);
  };

  const hasFilters = search || city !== 'all' || region !== 'all' || categoryId !== 'all' || subcategory !== 'all';
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );

  return (
    <Layout>
      {/* Header */}
      <div className="hero-bg py-12 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-black mb-3 animate-fade-in-up">{t('findMaster')}</h1>
          <p className="text-white/80 text-lg mb-8 animate-fade-in-up delay-100">
            {t('findMasterDesc')}
          </p>
          <div className="flex gap-2 animate-fade-in-up delay-200">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-background text-foreground"
              />
            </div>
            <Button
              variant="secondary"
              className="h-12 px-4 rounded-xl gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:block">{t('filter')}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        {showFilters && (
          <div className="card-premium p-5 mb-6 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Select value={categoryId} onValueChange={v => { setCategoryId(v); setSubcategory('all'); setPage(1); }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Kategoriya" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')} kategoriya</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {lang === 'ru' ? c.name_ru : lang === 'en' ? c.name_en : c.name_uz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={subcategory}
                onValueChange={v => { setSubcategory(v); setPage(1); }}
                disabled={subOptions.length === 0}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Subkategoriya" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {subOptions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{catName(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={region} onValueChange={v => { setRegion(v); setPage(1); }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t('region')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')} {t('allRegions')}</SelectItem>
                  {uzbekRegions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={city} onValueChange={v => { setCity(v); setPage(1); }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t('city')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')} {t('allCities')}</SelectItem>
                  {uzbekCities.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={v => { setSortBy(v); setPage(1); }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t('sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">{t('sortByRating')}</SelectItem>
                  <SelectItem value="jobs">{t('sortByJobs')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">{loading ? '...' : filtered.length}</span> {t('mastersFound')}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive rounded-xl" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              {t('clearFilters')}
            </Button>
          )}
        </div>

        {/* Skeleton loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-premium p-5 space-y-4">
                <div className="flex gap-3">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full rounded-xl" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            {/* Masters grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((master, i) => (
                <div
                  key={master.id}
                  className="card-premium p-5 hover-lift cursor-pointer group animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => navigate(`/master/${master.id}`)}
                >
                  {/* Header */}
                  <div className="flex gap-3 mb-4">
                    <div className="relative shrink-0">
                      <img
                        src={master.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(master.full_name)}&background=6366f1&color=fff&size=128`}
                        alt={master.full_name}
                        className="w-16 h-16 rounded-2xl object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight truncate">{master.full_name}</h3>
                        {master.is_verified && (
                          <CheckCircle className="h-4 w-4 text-success shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        {renderStars(master.rating)}
                        <span className="text-xs font-semibold text-amber-500">{master.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({master.reviews_count})</span>
                      </div>
                      {master.city && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{master.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl bg-muted/50">
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">{master.jobs_completed}</p>
                      <p className="text-[10px] text-muted-foreground">{t('jobs')}</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-sm font-bold text-foreground">{master.experience_years}{lang === 'en' ? 'y' : lang === 'ru' ? 'л' : 'y'}</p>
                      <p className="text-[10px] text-muted-foreground">{t('experienceLabel')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-primary">{master.reviews_count}</p>
                      <p className="text-[10px] text-muted-foreground">{t('reviews')}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  {master.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {master.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[10px] py-0 px-2">
                          {skill}
                        </Badge>
                      ))}
                      {master.skills.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-2">
                          +{master.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 rounded-xl text-xs gap-1.5"
                      onClick={(e) => { e.stopPropagation(); navigate(`/master/${master.id}`); }}
                    >
                      {t('viewProfile')}
                    </Button>
                    {master.phone && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-xl h-8 w-8 shrink-0"
                        onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${master.phone}`; }}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-xl h-8 w-8 shrink-0"
                      onClick={(e) => { e.stopPropagation(); navigate(`/messages?master=${master.user_id}`); }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ←
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-xl w-9"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && <span className="text-muted-foreground">...</span>}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  →
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UserPlus className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{t('noMasterFound')}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('changeSearchTerms')}</p>
            <div className="flex gap-3 justify-center">
              {hasFilters && (
                <Button onClick={clearFilters} variant="outline" className="rounded-xl gap-2">
                  <X className="h-4 w-4" />
                  {t('clearFilters')}
                </Button>
              )}
              <Button onClick={() => navigate('/login')} className="rounded-xl gap-2">
                <UserPlus className="h-4 w-4" />
                {t('registerAsMaster')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
