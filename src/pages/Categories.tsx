import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
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

interface Category {
  id: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  icon: string;
  color: string | null;
  order_num: number | null;
}

export default function CategoriesPage() {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [masterCounts, setMasterCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('order_num');
      if (cats) setCategories(cats);

      // Fetch master counts per category
      const { data: masters } = await supabase
        .from('master_profiles')
        .select('category_ids')
        .eq('is_approved', true);

      if (masters) {
        const counts: Record<string, number> = {};
        masters.forEach(m => {
          (m.category_ids || []).forEach((cid: string) => {
            counts[cid] = (counts[cid] || 0) + 1;
          });
        });
        setMasterCounts(counts);
      }
    };
    fetchData();
  }, []);

  const getName = (cat: Category) => {
    if (lang === 'ru') return cat.name_ru;
    if (lang === 'en') return cat.name_en;
    return cat.name_uz;
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat, i) => {
            const Icon = iconMap[cat.icon] || Hammer;
            const count = masterCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/find-master?category=${cat.name_uz}`)}
                className="card-premium p-5 flex flex-col items-center text-center gap-3 hover-lift group animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${cat.color || '#3b82f6'}18` }}
                >
                  <Icon className="h-7 w-7" style={{ color: cat.color || '#3b82f6' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight mb-1">{getName(cat)}</p>
                  {count > 0 && (
                    <p className="text-xs text-muted-foreground">{count} {t('masterCountSuffix')}</p>
                  )}
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
