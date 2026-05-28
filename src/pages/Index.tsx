import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import TopMasters from '@/components/TopMasters';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { categoryTree } from '@/lib/categoryTaxonomy';
import {
  Search, Shield, Star, Clock, Sparkles, ArrowRight, CheckCircle2,
  Smartphone, Download, Apple, Zap, Users, Award, TrendingUp,
  MessageSquare, MapPin, CreditCard, ChevronRight, PlayCircle,
  ThumbsUp, Lock, Headphones, Quote,
} from 'lucide-react';

/* ---------- Live counter ---------- */
function Counter({ end, suffix = '', duration = 1600 }: { end: number; suffix?: string; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.floor(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return <span>{n.toLocaleString()}{suffix}</span>;
}

export default function Index() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const go = (q?: string) =>
    navigate(`/find-master${q ? `?q=${encodeURIComponent(q)}` : (search ? `?q=${encodeURIComponent(search)}` : '')}`);

  return (
    <Layout>
      {/* ============ 1. HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border border-white/5" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-6 animate-fade-in border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                O'zbekistondagi #1 ustalar platformasi
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-5 animate-fade-in-up tracking-tight">
                Har qanday ish uchun
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400">
                  ishonchli usta
                </span>
                <br />3 daqiqada
              </h1>
              <p className="text-white/85 text-lg max-w-xl mb-8 animate-fade-in-up delay-100">
                Tekshirilgan ustalar, shaffof narxlar, kafolatlangan sifat. Buyurtma bering — 5 daqiqada javob oling.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 max-w-xl animate-fade-in-up delay-200">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Qanday xizmat kerak? Masalan: santexnik"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && go()}
                    className="pl-12 h-14 rounded-2xl bg-white text-foreground text-base border-0 shadow-2xl"
                  />
                </div>
                <Button className="h-14 px-8 rounded-2xl btn-accent text-base shrink-0 shadow-2xl" onClick={() => go()}>
                  Qidirish <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-5 animate-fade-in-up delay-300">
                <span className="text-white/70 text-xs mr-1 self-center">Mashhur:</span>
                {['Santexnik', 'Elektrik', 'Konditsioner', 'Kompyuter', 'Tozalash'].map(tag => (
                  <button key={tag} onClick={() => go(tag)}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white text-xs transition">
                    {tag}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-10 animate-fade-in-up delay-300">
                {[
                  { v: 10000, s: '+', label: 'Faol usta', icon: Users },
                  { v: 50000, s: '+', label: 'Buyurtma', icon: CheckCircle2 },
                  { v: 4.9, s: '★', label: 'O\'rtacha reyting', icon: Star, fixed: true },
                ].map((st, i) => (
                  <div key={i} className="glass rounded-2xl p-3 sm:p-4 border border-white/15">
                    <st.icon className="h-4 w-4 text-amber-300 mb-1.5" />
                    <p className="text-2xl sm:text-3xl font-black text-white">
                      {st.fixed ? <>4.9<span className="text-amber-300">★</span></> : <><Counter end={st.v} />{st.s}</>}
                    </p>
                    <p className="text-[11px] sm:text-xs text-white/70 mt-0.5">{st.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating cards */}
            <div className="relative hidden lg:block h-[520px]">
              <div className="absolute top-0 right-0 w-72 bg-white rounded-2xl shadow-2xl p-5 animate-fade-in-up delay-100" style={{ transform: 'rotate(-2deg)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl">⚡</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">Aziz Karimov</p>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">4.9</span>
                      <span className="text-muted-foreground">(248)</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Elite</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">⚡ Elektrik · Toshkent</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Online</span>
                  <span className="font-bold text-primary">80,000 so'm/soat</span>
                </div>
              </div>

              <div className="absolute top-44 left-0 w-72 bg-white rounded-2xl shadow-2xl p-5 animate-fade-in-up delay-200" style={{ transform: 'rotate(3deg)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground">YANGI BUYURTMA</p>
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">5 daq.</Badge>
                </div>
                <p className="font-bold text-sm mb-1">Konditsioner o'rnatish</p>
                <p className="text-xs text-muted-foreground mb-3">Chilonzor · 2 ta xona</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Taxminiy:</span>
                  <span className="font-black text-primary">450k - 600k</span>
                </div>
              </div>

              <div className="absolute bottom-0 right-8 w-80 bg-white rounded-2xl shadow-2xl p-5 animate-fade-in-up delay-300" style={{ transform: 'rotate(-3deg)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <p className="font-bold text-sm">Kafolat va Xavfsizlik</p>
                </div>
                <div className="space-y-2">
                  {['Hujjatlar tekshirilgan', 'Pul kafolati', '24/7 yordam'].map(x => (
                    <div key={x} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{x}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute top-20 right-1/2 w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center text-2xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>🔧</div>
              <div className="absolute bottom-1/3 left-1/4 w-12 h-12 rounded-2xl bg-emerald-400 flex items-center justify-center text-xl shadow-xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2. TRUST STRIP ============ */}
      <section className="border-y border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { i: Shield, t: 'Tekshirilgan', s: 'Pasport va litsenziya' },
              { i: Star, t: '4.9 reyting', s: '50,000+ sharhlar' },
              { i: Clock, t: '5 daqiqa', s: 'O\'rtacha javob' },
              { i: Lock, t: 'Xavfsiz to\'lov', s: 'Pul kafolati' },
            ].map(x => (
              <div key={x.t} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <x.i className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight">{x.t}</p>
                  <p className="text-xs text-muted-foreground truncate">{x.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 3. POPULAR CATEGORIES (hierarchical) ============ */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10 border-0">Kategoriyalar</Badge>
          <h2 className="text-3xl sm:text-4xl font-black mb-3">Har qanday xizmatni toping</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">7 ta asosiy yo'nalish, 40+ subkategoriya, yuzlab xizmat turlari</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryTree.map((cat, i) => (
            <div key={cat.slug}
              className="group card-premium p-6 hover-lift cursor-pointer relative overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => navigate(`/find-master?category=${cat.slug}`)}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: cat.color }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                    style={{ backgroundColor: `${cat.color}15` }}>
                    {cat.emoji}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-black text-lg mb-1">{cat.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{cat.subs.length} ta subkategoriya</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.subs.slice(0, 4).map(s => (
                    <span key={s.slug} className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
                      {s.name}
                    </span>
                  ))}
                  {cat.subs.length > 4 && (
                    <span className="text-[11px] px-2 py-1 rounded-md bg-primary/10 text-primary font-semibold">
                      +{cat.subs.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="rounded-xl" onClick={() => navigate('/categories')}>
            Barcha kategoriyalarni ko'rish <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ============ 4. TOP MASTERS ============ */}
      <TopMasters />

      {/* ============ 5. AI RECOMMENDATION ============ */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="rounded-3xl overflow-hidden relative" style={{ background: 'var(--gradient-primary)' }}>
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
          </div>
          <div className="relative grid lg:grid-cols-2 gap-8 p-8 sm:p-12 text-white items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white hover:bg-white/20 border-0 backdrop-blur">
                <Sparkles className="h-3 w-3 mr-1" /> AI Powered
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                AI sizga eng mos ustani topadi
              </h2>
              <p className="text-white/85 mb-6">
                Muammoingizni yozing — AI mos ustalarni saralab, taxminiy narxni hisoblab beradi. 30 soniyada.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Aqlli matching algoritmi',
                  'Avtomatik narx hisoblash',
                  'Reyting va tajriba bo\'yicha tartiblash',
                  'Joylashuvga eng yaqin ustalar',
                ].map(x => (
                  <li key={x} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm">{x}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="btn-accent rounded-xl" onClick={() => navigate('/order/create')}>
                <Sparkles className="mr-2 h-4 w-4" /> AI bilan boshlash
              </Button>
            </div>

            <div className="bg-white/95 backdrop-blur rounded-2xl p-6 shadow-2xl text-foreground">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="font-bold">UstaZone AI</p>
                <span className="ml-auto text-xs text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
                </span>
              </div>
              <div className="bg-muted/60 rounded-xl p-3 mb-3 text-sm">
                "Vannada quvur oqyapti, suv sizib chiqyapti"
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Sizga <b>Santexnik</b> kerak</span>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Taxminiy narx: <b className="text-primary">150k – 250k so'm</b></span>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><b>12 ta</b> mos usta topildi (1 km radius)</span>
                </div>
              </div>
              <Button className="w-full mt-4 rounded-xl" onClick={() => navigate('/find-master')}>
                Ustalarni ko'rish
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 6. HOW IT WORKS ============ */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-3 bg-accent/15 text-accent-foreground hover:bg-accent/15 border-0" style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))' }}>
            Qanday ishlaydi
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black mb-3">3 ta oddiy qadam</h2>
          <p className="text-muted-foreground">Buyurtmadan tugatishgacha — atigi bir necha daqiqa</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 border-t-2 border-dashed border-primary/30" />
          {[
            { n: 1, i: MessageSquare, t: 'Buyurtma bering', d: 'Xizmat turini tanlang yoki AI ga muammoni yozing. 1 daqiqa.', c: '#2563eb' },
            { n: 2, i: Users, t: 'Ustani tanlang', d: 'Mos ustalardan reyting, narx va tajriba bo\'yicha tanlang.', c: '#f59e0b' },
            { n: 3, i: CheckCircle2, t: 'Ish tugadi', d: 'Usta keladi, ishni bajaradi, siz to\'laysiz va baholaysiz.', c: '#10b981' },
          ].map((s, i) => (
            <div key={s.n} className="relative card-premium p-6 text-center hover-lift animate-fade-in-up" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="relative inline-flex mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${s.c}, ${s.c}dd)` }}>
                  <s.i className="h-7 w-7" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-current flex items-center justify-center font-black text-sm" style={{ color: s.c }}>
                  {s.n}
                </div>
              </div>
              <h3 className="font-black text-lg mb-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 7. TRUST & SECURITY ============ */}
      <section className="section-padding bg-gradient-to-br from-muted/40 via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                <Shield className="h-3 w-3 mr-1" /> Xavfsizlik
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Sizning xavfsizligingiz — bizning ustuvor vazifamiz
              </h2>
              <p className="text-muted-foreground mb-8">
                Har bir usta qat'iy tekshiruvdan o'tadi. Pul kafolati va 24/7 yordam — har doim sizning yoningizda.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { i: Shield, t: 'Pasport tekshiruvi', d: 'Har bir usta ID orqali tasdiqlangan' },
                  { i: Award, t: 'Mahorat tasdig\'i', d: 'Sertifikatlar va portfolio tekshirilgan' },
                  { i: CreditCard, t: 'Xavfsiz to\'lov', d: 'Click va Payme orqali himoyalangan' },
                  { i: Headphones, t: '24/7 yordam', d: 'Har qanday savol bo\'yicha qo\'llab-quvvatlash' },
                ].map(x => (
                  <div key={x.t} className="flex gap-3 p-4 rounded-xl bg-card border border-border hover-lift">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                      <x.i className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm mb-0.5">{x.t}</p>
                      <p className="text-xs text-muted-foreground">{x.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="card-premium p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <p className="font-bold">Tekshirilgan Usta</p>
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">✓ Verified</Badge>
                </div>
                <div className="space-y-3">
                  {[
                    'Pasport ma\'lumotlari tasdiqlangan',
                    'Telefon raqami tekshirilgan',
                    'Tajriba va sertifikatlar',
                    'Mijozlar tomonidan baholangan',
                    'Sug\'urtalangan xizmatlar',
                  ].map(x => (
                    <div key={x} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      <span className="text-sm">{x}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full rounded-3xl bg-primary/10 -z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ 8. REAL REVIEWS ============ */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
            <Star className="h-3 w-3 mr-1 fill-current" /> Sharhlar
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black mb-3">Mijozlarimiz nima deyishadi</h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}</div>
            <span className="font-bold text-foreground">4.9</span>
            <span>· 50,000+ sharhlar</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Dilshod A.', role: 'Mijoz · Toshkent', text: 'Santexnik 30 daqiqada keldi va muammoni hal qildi. Narxi ham juda arzon, sifati a\'lo!', rating: 5, emoji: '👨' },
            { name: 'Malika R.', role: 'Mijoz · Samarqand', text: 'Konditsioner o\'rnatish uchun usta chaqirdim. Professional ish, hammasi joyida. Tavsiya qilaman!', rating: 5, emoji: '👩' },
            { name: 'Bobur T.', role: 'Mijoz · Buxoro', text: 'AI dan foydalandim — bir necha soniyada eng mos ustani topdi. Narx ham aniq chiqdi. Zo\'r platforma!', rating: 5, emoji: '🧔' },
          ].map((r, i) => (
            <div key={i} className="card-premium p-6 hover-lift relative animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
              <div className="flex mb-3">{[...Array(r.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-sm mb-5 leading-relaxed">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-lg">
                  {r.emoji}
                </div>
                <div>
                  <p className="font-bold text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 9. MOBILE APP PROMO ============ */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="rounded-3xl overflow-hidden relative bg-foreground text-background">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
          </div>
          <div className="relative grid lg:grid-cols-2 gap-8 p-8 sm:p-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary/20 text-primary-foreground hover:bg-primary/20 border-0 backdrop-blur" style={{ color: 'white' }}>
                <Smartphone className="h-3 w-3 mr-1" /> Tez orada
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">UstaZone mobil ilovasi</h2>
              <p className="opacity-80 mb-8 max-w-md">
                Telefoningizdan buyurtma bering, ustalar bilan chating va xizmat holatini real vaqtda kuzating.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" variant="secondary" className="rounded-xl gap-2 bg-background text-foreground hover:bg-background/90">
                  <Apple className="h-5 w-5" />
                  <div className="text-left">
                    <p className="text-[10px] opacity-70 leading-none">Download on the</p>
                    <p className="font-bold leading-tight">App Store</p>
                  </div>
                </Button>
                <Button size="lg" variant="secondary" className="rounded-xl gap-2 bg-background text-foreground hover:bg-background/90">
                  <PlayCircle className="h-5 w-5" />
                  <div className="text-left">
                    <p className="text-[10px] opacity-70 leading-none">GET IT ON</p>
                    <p className="font-bold leading-tight">Google Play</p>
                  </div>
                </Button>
              </div>

              <div className="flex items-center gap-6 mt-8">
                {[
                  { v: '4.9★', l: 'App reyting' },
                  { v: '< 1s', l: 'Buyurtma' },
                  { v: '24/7', l: 'Yordam' },
                ].map(s => (
                  <div key={s.l}>
                    <p className="text-2xl font-black">{s.v}</p>
                    <p className="text-xs opacity-70">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[400px] hidden lg:block">
              <div className="absolute top-0 right-12 w-56 h-[380px] bg-background rounded-[2.5rem] shadow-2xl p-4 border-8 border-background/10" style={{ transform: 'rotate(-6deg)' }}>
                <div className="h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary-dark p-4 text-white flex flex-col">
                  <p className="text-xs opacity-80">Salom 👋</p>
                  <p className="font-black text-lg mb-4">Qanday yordam beray?</p>
                  <div className="bg-white/15 rounded-xl p-3 mb-2 backdrop-blur">
                    <p className="text-xs">🔧 Santexnik</p>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3 mb-2 backdrop-blur">
                    <p className="text-xs">⚡ Elektrik</p>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
                    <p className="text-xs">❄️ Konditsioner</p>
                  </div>
                  <div className="mt-auto bg-amber-400 text-foreground rounded-xl p-3 text-center text-xs font-bold">
                    Buyurtma berish
                  </div>
                </div>
              </div>
              <div className="absolute top-12 right-48 w-56 h-[380px] bg-background rounded-[2.5rem] shadow-2xl p-4 border-8 border-background/10" style={{ transform: 'rotate(4deg)' }}>
                <div className="h-full rounded-[1.5rem] bg-muted p-4 flex flex-col text-foreground">
                  <p className="text-xs text-muted-foreground">Topildi: 12 ta usta</p>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card rounded-xl p-3 mt-2 flex items-center gap-2 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-primary/15" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">Usta #{i}</p>
                        <p className="text-[10px] text-muted-foreground">★ 4.9 · 80k/soat</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 10. FAQ ============ */}
      <section className="section-padding max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10 border-0">FAQ</Badge>
          <h2 className="text-3xl sm:text-4xl font-black mb-3">Tez-tez so'raladigan savollar</h2>
          <p className="text-muted-foreground">Javob topa olmadingizmi? Bizga yozing.</p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {[
            { q: 'UstaZone qanday ishlaydi?', a: 'Ro\'yxatdan o\'tasiz, kerakli xizmatni tanlaysiz, mos ustani topasiz va buyurtma berasiz. Usta keladi va ishni bajaradi.' },
            { q: 'Ustalar tekshirilganmi?', a: 'Ha, har bir usta pasport, telefon va sertifikatlar bo\'yicha tekshiruvdan o\'tadi. Faqat tasdiqlangan ustalar platformada bo\'ladi.' },
            { q: 'To\'lov qanday amalga oshiriladi?', a: 'Naqd, Click, Payme yoki karta orqali to\'lashingiz mumkin. Online to\'lovlar to\'liq xavfsiz va kafolatlangan.' },
            { q: 'Agar xizmat sifatsiz bo\'lsa-chi?', a: 'Bizda pul kafolati tizimi mavjud. 24 soat ichida shikoyat qoldirsangiz, pulingiz qaytariladi yoki ish qayta bajariladi.' },
            { q: 'Usta bo\'lib qanday ro\'yxatdan o\'tish mumkin?', a: '"Usta sifatida ro\'yxatdan o\'tish" tugmasini bosing, ma\'lumotlaringizni kiriting va tasdiqdan o\'ting. 24 soat ichida faollashadi.' },
            { q: 'Xizmat narxi qanday belgilanadi?', a: 'Narx usta tomonidan belgilanadi va platformada ochiq ko\'rsatiladi. AI ham taxminiy narxni avtomatik hisoblab beradi.' },
          ].map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="card-premium px-5 border-0 rounded-xl">
              <AccordionTrigger className="text-left font-bold text-sm hover:no-underline py-4">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ============ 11. FINAL CTA ============ */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="rounded-3xl p-8 sm:p-14 text-white text-center relative overflow-hidden"
          style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative">
            <Sparkles className="h-10 w-10 text-amber-300 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-5xl font-black mb-4 max-w-2xl mx-auto leading-tight">
              Bugundan boshlab xizmatlar qulay bo'lsin
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              Bir necha daqiqada ro'yxatdan o'ting va eng yaxshi ustalardan foydalaning
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="btn-accent rounded-xl text-base h-12 px-8" onClick={() => navigate('/register')}>
                Bepul ro'yxatdan o'tish <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl text-base h-12 px-8 border-white/30 text-white hover:bg-white/10" onClick={() => navigate('/find-master')}>
                Ustalarni ko'rish
              </Button>
            </div>
            <p className="text-white/60 text-xs mt-6 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Bepul ro'yxatdan o'tish</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Yashirin to'lovlar yo'q</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> 24/7 yordam</span>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
