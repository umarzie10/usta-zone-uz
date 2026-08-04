import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import SeoHead from '@/components/SeoHead';
import { categoryTree } from '@/lib/categoryTaxonomy';
import { uzbekCities } from '@/lib/demoData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Star, MapPin, ArrowRight, Loader2 } from 'lucide-react';

interface MasterRow {
  id: string;
  rating: number;
  jobs_completed: number;
  full_name: string;
}

export default function CityLanding() {
  const { city } = useParams();
  const navigate = useNavigate();
  const cityName = uzbekCities.find((c) => c.toLowerCase() === decodeURIComponent(city || '').toLowerCase());
  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityName) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id,full_name')
        .eq('city', cityName)
        .eq('role', 'master')
        .limit(12);
      const ids = (profs || []).map((p) => p.user_id);
      const { data: mps } = ids.length
        ? await supabase.from('master_profiles').select('id,user_id,rating,jobs_completed').in('user_id', ids).eq('is_active', true)
        : { data: [] as any[] };
      const nameMap = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
      setMasters((mps || []).map((m: any) => ({
        id: m.id,
        rating: m.rating || 0,
        jobs_completed: m.jobs_completed || 0,
        full_name: nameMap.get(m.user_id) || 'Usta',
      })));
      setLoading(false);
    })();
  }, [cityName]);

  if (!cityName) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-black mb-3">Shahar topilmadi</h1>
          <Button className="rounded-xl" onClick={() => navigate('/find-master')}>Usta topish</Button>
        </div>
      </Layout>
    );
  }

  const slug = cityName.toLowerCase();
  const title = `${cityName} shahridagi ustalar — elektrik, santexnik, remont | UstaZone`;
  const description = `${cityName} shahrida tekshirilgan ustalarni toping: elektrik, santexnik, konditsioner, remont va boshqa xizmatlar. Onlayn buyurtma bering — UstaZone.`;

  const faq = [
    { q: `${cityName}da usta qanchalik tez keladi?`, a: `${cityName} bo'ylab ustalar odatda 30–60 daqiqa ichida yetib boradi, shoshilinch buyurtmalar birinchi navbatda ko'riladi.` },
    { q: "To'lov qanday amalga oshiriladi?", a: "Naqd, Click yoki Payme orqali to'lash mumkin. Platforma komissiyasi avtomatik hisoblanadi." },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: `UstaZone — ${cityName}`,
      description,
      url: `https://usta-zone-uz.lovable.app/shahar/${encodeURIComponent(slug)}`,
      areaServed: { '@type': 'City', name: cityName },
      address: { '@type': 'PostalAddress', addressLocality: cityName, addressCountry: 'UZ' },
      priceRange: 'UZS',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <Layout>
      <SeoHead title={title} description={description} path={`/shahar/${encodeURIComponent(slug)}`} jsonLd={jsonLd} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        <header className="text-center animate-fade-in-up">
          <h1 className="text-2xl sm:text-4xl font-black mb-3">{cityName} shahridagi ustalar</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
          <Button className="rounded-xl btn-hero mt-5 h-12 px-6 gap-2" onClick={() => navigate(`/find-master?city=${encodeURIComponent(cityName)}`)}>
            {cityName}da usta topish <ArrowRight className="h-4 w-4" />
          </Button>
        </header>

        <section>
          <h2 className="text-xl font-bold mb-4">{cityName}dagi mashhur xizmatlar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryTree.map((c, i) => (
              <Link key={c.slug} to={`/xizmatlar/${c.slug}`} className="card-premium p-4 hover-lift" data-reveal-i={i}>
                <span className="text-2xl">{c.emoji}</span>
                <p className="text-sm font-semibold mt-1.5">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{cityName} bo'yicha</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">{cityName}dagi ustalar</h2>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : masters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu shaharda hozircha faol usta yo'q.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {masters.map((m, i) => (
                <Link key={m.id} to={`/master/${m.id}`} className="card-premium p-4 hover-lift" data-reveal-i={i}>
                  <p className="font-bold truncate">{m.full_name}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400 fill-amber-400" />{m.rating.toFixed(1)}</span>
                    <span>{m.jobs_completed} ish</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{cityName}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Boshqa shaharlar</h2>
          <div className="flex flex-wrap gap-2">
            {uzbekCities.filter((c) => c !== cityName).map((c) => (
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
