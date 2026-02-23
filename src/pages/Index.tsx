import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { demoCategories } from '@/lib/demoData';
import { Search, Star, Shield, Clock, ChevronRight, Droplets, Zap, Sparkles, Sofa, Hammer, Palette, Wind, Cog, Thermometer, DoorOpen, Square, Flame, Layers, LayoutGrid, RectangleHorizontal, Wifi, Camera, SprayCan, Waves } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Droplets, Zap, Sparkles, Sofa, Hammer, Palette, Wind, Cog, Thermometer, DoorOpen, Square, Flame, Layers, LayoutGrid, RectangleHorizontal, Wifi, Camera, SprayCan, Waves,
};

export default function Index() {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const getName = (cat: typeof demoCategories[0]) => {
    if (lang === 'ru') return cat.nameRu;
    if (lang === 'en') return cat.nameEn;
    return cat.nameUz;
  };

  const topCategories = demoCategories.slice(0, 12);

  return (
    <Layout>
      {/* Hero */}
      <section className="hero-bg relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-6 animate-fade-in">
            <span className="text-amber-300">★</span> {t('platformBadge')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5 animate-fade-in-up">
            {t('heroTitle')}
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up delay-100">
            {t('heroSubtitle')}
          </p>

          {/* Search bar */}
          <div className="flex gap-2 max-w-2xl mx-auto animate-fade-in-up delay-200">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && navigate(`/find-master?q=${search}`)}
                className="pl-12 h-14 rounded-2xl bg-background text-foreground text-base"
              />
            </div>
            <Button
              className="h-14 px-8 rounded-2xl btn-hero text-base shrink-0"
              onClick={() => navigate(`/find-master?q=${search}`)}
            >
              {t('searchBtn')}
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 animate-fade-in-up delay-300">
            {[t('mastersCount'), t('ordersCount'), t('citiesCount')].map(s => (
              <div key={s} className="flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium">
                <span className="text-amber-300">✓</span> {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Shield, label: t('verifiedMasters'), sub: t('verifiedMastersDesc') },
              { icon: Star, label: t('avgRating'), sub: t('avgRatingDesc') },
              { icon: Clock, label: t('fastResponse'), sub: t('fastResponseDesc') },
            ].map(b => (
              <div key={b.label} className="flex flex-col items-center gap-1.5 p-3">
                <b.icon className="h-6 w-6 text-primary" />
                <p className="font-semibold text-sm">{b.label}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black">{t('popularCategories')}</h2>
            <p className="text-muted-foreground mt-1">{t('selectService')}</p>
          </div>
          <Button variant="ghost" className="gap-1 rounded-xl text-primary" onClick={() => navigate('/categories')}>
            {t('viewAll')} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {demoCategories.slice(0, 12).map((cat, i) => {
            const Icon = iconMap[cat.icon] || Hammer;
            return (
              <button key={cat.id} onClick={() => navigate(`/find-master?category=${cat.nameUz}`)}
                className="card-premium p-4 flex flex-col items-center text-center gap-2.5 hover-lift group animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${cat.color}18` }}>
                  <Icon className="h-6 w-6" style={{ color: cat.color }} />
                </div>
                <p className="font-medium text-xs leading-tight">{getName(cat)}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Top masters CTA */}
      <section className="section-padding bg-muted/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-3">{t('topMasters')}</h2>
          <p className="text-muted-foreground mb-6">{t('bestRatedMasters')}</p>
          <Button className="rounded-xl gap-2" onClick={() => navigate('/find-master')}>
            {t('findMaster')} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="hero-bg rounded-3xl p-10 sm:p-14 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">{t('becomeMaster')}</h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              {t('becomeMasterDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="btn-accent h-12 px-8 rounded-xl text-base" onClick={() => navigate('/register')}>
                {t('registerAsMaster')}
              </Button>
              <Button variant="outline" className="h-12 px-8 rounded-xl text-base border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate('/about')}>
                {t('moreInfo')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
