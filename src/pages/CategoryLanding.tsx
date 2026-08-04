import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import SeoHead from '@/components/SeoHead';
import { categoryTree } from '@/lib/categoryTaxonomy';
import { uzbekCities } from '@/lib/demoData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MapPin, Star, ArrowRight, Loader2 } from 'lucide-react';

interface MasterRow {
  id: string;
  user_id: string;
  rating: number;
  jobs_completed: number;
  full_name: string;
  city: string | null;
}

export default function CategoryLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cat = categoryTree.find((c) => c.slug === slug);
  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: mps } = await supabase
        .from('master_profiles')
        .select('id,user_id,rating,jobs_completed')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(9);
      const ids = (mps || []).map((m) => m.user_id);
      const { data: profs } = ids.length
        ? await supabase.from('profiles').select('user_id,full_name,city').in('user_id', ids)
        : { data: [] as any[] };
      const pMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      setMasters((mps || []).map((m) => ({
        id: m.id,
        user_id: m.user_id,
        rating: m.rating || 0,
        jobs_completed: m.jobs_completed || 0,
        full_name: pMap.get(m.user_id)?.full_name || 'Usta',
        city: pMap.get(m.user_id)?.city || null,
      })));
      setLoading(false);
    })();
  }, [slug]);

  if (!cat) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-black mb-3">Kategoriya topilmadi</h1>
          <Button className="rounded-xl" onClick={() => navigate('/categories')}>Barcha kategoriyalar</Button>
        </div>
      </Layout>
    );
  }

  const title = `${cat.name} ustalari — O'zbekiston bo'ylab | UstaZone`;
  const description = `${cat.name} bo'yicha tekshirilgan ustalarni UstaZone'dan toping: ${cat.subs
    .slice(0, 5)
    .map((s) => s.name)
    .join(', ')} va boshqalar. Narxlarni solishtiring va onlayn buyurtma bering.`;

  const faq = [
    {
      q: `${cat.name} ustasini qanday buyurtma qilaman?`,
      a: `UstaZone'da kategoriyani tanlang, muammoni yozing va bir necha daqiqada yaqiningizdagi ${cat.name.toLowerCase()} ustasi javob beradi.`,
    },
    { q: 'Xizmat narxi qancha?', a: "Narx ish hajmiga bog'liq. Har bir usta o'z narxini ko'rsatadi, siz taqqoslab tanlaysiz." },
    { q: 'Ustalar tekshirilganmi?', a: 'Ha, hujjat va selfi verifikatsiyasidan o\'tgan ustalar "Verified Usta" nishoniga ega bo\'ladi.' },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `${cat.name} xizmatlari`,
      areaServed: { '@type': 'Country', name: "O'zbekiston" },
      provider: { '@type': 'Organization', name: 'UstaZone', url: 'https://usta-zone-uz.lovable.app' },
      description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Bosh sahifa', item: 'https://usta-zone-uz.lovable.app/' },
        { '@type': 'ListItem', position: 2, name: 'Kategoriyalar', item: 'https://usta-zone-uz.lovable.app/categories' },
        { '@type': 'ListItem', position: 3, name: cat.name },
      ],
    },
  ];

  return (
    <Layout>
      <SeoHead title={title} description={description} path={`/xizmatlar/${cat.slug}`} jsonLd={jsonLd} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        <header className="text-center animate-fade-in-up">
          <div className="text-5xl mb-3">{cat.emoji}</div>
          <h1 className="text-2xl sm:text-4xl font-black mb-3">{cat.name} ustalari</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
          <Button className="rounded-xl btn-hero mt-5 h-12 px-6 gap-2" onClick={() => navigate(`/find-master?category=${cat.slug}`)}>
            Usta topish <ArrowRight className="h-4 w-4" />
          </Button>
        </header>

        <section>
          <h2 className="text-xl font-bold mb-4">{cat.name} yo'nalishlari</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cat.subs.map((s, i) => (
              <Link
                key={s.slug}
                to={`/find-master?category=${cat.slug}&sub=${s.slug}`}
                className="card-premium p-4 hover-lift text-sm font-semibold"
                data-reveal-i={i}
              >
                {s.name}
                {s.services && <span className="block text-[11px] font-normal text-muted-foreground mt-1 truncate">{s.services.join(', ')}</span>}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Eng yaxshi ustalar</h2>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : masters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hozircha usta yo'q.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {masters.map((m, i) => (
                <Link key={m.id} to={`/master/${m.id}`} className="card-premium p-4 hover-lift" data-reveal-i={i}>
                  <p className="font-bold truncate">{m.full_name}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400 fill-amber-400" />{m.rating.toFixed(1)}</span>
                    <span>{m.jobs_completed} ish</span>
                    {m.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.city}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Shaharlar bo'yicha</h2>
          <div className="flex flex-wrap gap-2">
            {uzbekCities.map((c) => (
              <Link key={c} to={`/shahar/${encodeURIComponent(c.toLowerCase())}`} className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition">
                {c}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Ko'p so'raladigan savollar</h2>
          <div className="space-y-3">
            {faq.map((f) => (
              <div key={f.q} className="card-premium p-4">
                <p className="font-semibold text-sm mb-1">{f.q}</p>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
