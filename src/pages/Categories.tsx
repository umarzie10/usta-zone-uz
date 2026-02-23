import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { demoCategories } from '@/lib/demoData';
import {
  Droplets, Zap, Sparkles, Sofa, Hammer, Palette, Wind, Cog,
  Thermometer, DoorOpen, Square, Flame, Layers, LayoutGrid,
  RectangleHorizontal, Wifi, Camera, SprayCan, Waves
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Droplets, Zap, Sparkles, Sofa, Hammer, Palette, Wind, Cog,
  Thermometer, DoorOpen, Square, Flame, Layers, LayoutGrid,
  RectangleHorizontal, Wifi, Camera, SprayCan, Waves,
};

export default function CategoriesPage() {
  const { t, lang } = useApp();
  const navigate = useNavigate();

  const getName = (cat: typeof demoCategories[0]) => {
    if (lang === 'ru') return cat.nameRu;
    if (lang === 'en') return cat.nameEn;
    return cat.nameUz;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-padding">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4 animate-fade-in-up">{t('allCategories')}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-fade-in-up delay-100">
            {t('categoriesDesc')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {demoCategories.map((cat, i) => {
            const Icon = iconMap[cat.icon] || Hammer;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/find-master?category=${cat.nameUz}`)}
                className="card-premium p-5 flex flex-col items-center text-center gap-3 hover-lift group animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${cat.color}18` }}
                >
                  <Icon className="h-7 w-7" style={{ color: cat.color }} />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight mb-1">{getName(cat)}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} {t('masterCountSuffix')}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats section */}
        <div className="mt-16 hero-bg rounded-3xl p-10 text-white text-center">
          <h2 className="text-3xl font-black mb-3">{t('platformName')}</h2>
          <p className="text-white/80 mb-8">{t('platformFullDesc')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { n: '20', l: t('categoryCount') },
              { n: '10K+', l: t('activeMasters') },
              { n: '50K+', l: t('completedJobsLabel') },
              { n: '12', l: t('regionsCount') },
            ].map(s => (
              <div key={s.l} className="glass rounded-2xl p-5">
                <p className="text-3xl font-black mb-1">{s.n}</p>
                <p className="text-white/70 text-sm">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
