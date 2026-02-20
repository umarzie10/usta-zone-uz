import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import MasterCard from '@/components/MasterCard';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { demoMasters, demoCategories, uzbekCities, uzbekRegions } from '@/lib/demoData';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function FindMasterPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [city, setCity] = useState('all');
  const [region, setRegion] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = demoMasters
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) || m.skills.some(s => s.toLowerCase().includes(q));
      const matchCategory = category === 'all' || m.category === category;
      const matchCity = city === 'all' || m.city === city;
      const matchRegion = region === 'all' || m.region === region;
      return matchSearch && matchCategory && matchCity && matchRegion;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'jobs') return b.jobsCompleted - a.jobsCompleted;
      if (sortBy === 'price_asc') return a.pricePerHour - b.pricePerHour;
      if (sortBy === 'price_desc') return b.pricePerHour - a.pricePerHour;
      return 0;
    });

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setCity('all');
    setRegion('all');
    setSortBy('rating');
  };

  const hasFilters = search || category !== 'all' || city !== 'all' || region !== 'all';

  return (
    <Layout>
      {/* Header */}
      <div className="hero-bg py-12 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-black mb-3 animate-fade-in-up">{t('findMaster')}</h1>
          <p className="text-white/80 text-lg mb-8 animate-fade-in-up delay-100">
            10,000+ malakali ustalar orasidan eng yaxshisini toping
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Kategoriya" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')} kategoriyalar</SelectItem>
                  {demoCategories.map(c => (
                    <SelectItem key={c.id} value={c.nameUz}>{c.nameUz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Viloyat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')} viloyatlar</SelectItem>
                  {uzbekRegions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Shahar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')} shaharlar</SelectItem>
                  {uzbekCities.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Saralash" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Reyting bo'yicha</SelectItem>
                  <SelectItem value="jobs">Ishlar bo'yicha</SelectItem>
                  <SelectItem value="price_asc">Narx (pastdan)</SelectItem>
                  <SelectItem value="price_desc">Narx (yuqoridan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">{filtered.length}</span> ta usta topildi
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive rounded-xl" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Filtrni tozalash
            </Button>
          )}
        </div>

        {/* Masters grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((master, i) => (
              <div key={master.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <MasterCard master={master} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Usta topilmadi</h3>
            <p className="text-muted-foreground mb-4">Qidiruv shartlarini o'zgartiring</p>
            <Button onClick={clearFilters} className="rounded-xl">Filtrni tozalash</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
