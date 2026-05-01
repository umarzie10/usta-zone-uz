import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Star, MapPin, Loader2, Navigation, Radio, Clock, MessageCircle, Send, ChevronLeft } from 'lucide-react';
import { getEta, EtaResult } from '@/lib/etaCache';
import { isUserOnline } from '@/hooks/useRealtimePresence';

interface MapMaster {
  master_id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  rating: number | null;
  jobs_completed: number | null;
  bio?: string | null;
  experience_years?: number | null;
  category_ids: string[];
  lat: number;
  lng: number;
  last_seen_at: string | null;
  category_names: { id: string; name: string }[];
  approx_location: boolean;
}

const cityCoords: Record<string, [number, number]> = {
  "Toshkent": [41.2995, 69.2401],
  "Samarqand": [39.6542, 66.9597],
  "Buxoro": [39.7745, 64.4286],
  "Namangan": [40.9983, 71.6726],
  "Andijon": [40.7821, 72.3442],
  "Farg'ona": [40.3842, 71.7889],
  "Nukus": [42.4628, 59.6003],
  "Qarshi": [38.8606, 65.7986],
  "Termiz": [37.2241, 67.2783],
  "Jizzax": [40.1158, 67.8422],
  "Navoiy": [40.1003, 65.3792],
  "Urganch": [41.5533, 60.6236],
};

function makeIcon(avatar: string, online: boolean) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:38px;height:38px;cursor:pointer;">
        <div style="position:absolute;inset:0;border-radius:50%;border:2.5px solid ${online ? '#22c55e' : '#94a3b8'};box-shadow:0 4px 10px rgba(0,0,0,.22);overflow:hidden;background:#fff;">
          <img src="${avatar}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="position:absolute;bottom:-1px;right:-1px;width:11px;height:11px;border-radius:50%;background:${online ? '#22c55e' : '#94a3b8'};border:2px solid #fff;"></div>
        ${online ? `<div style="position:absolute;inset:-3px;border-radius:50%;border:2px solid #22c55e;opacity:.5;animation:lm-pulse 1.8s ease-out infinite;"></div>` : ''}
      </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function userIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.3);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function FlyTo({ pos, zoom = 12 }: { pos: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, zoom, { duration: 1.2 }); }, [pos, zoom, map]);
  return null;
}

function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

type RadiusOpt = 0 | 1 | 3 | 5 | 10;

export default function LiveMap() {
  const { lang, showNotification, t } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [masters, setMasters] = useState<MapMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<'all' | 'online'>('all');
  const [radius, setRadius] = useState<RadiusOpt>(0);
  const [selected, setSelected] = useState<MapMaster | null>(null);
  const [routeInfo, setRouteInfo] = useState<EtaResult | null>(null);
  const [, setTick] = useState(0);
  const reloadRef = useRef<() => void>();

  // Quick-order form state (inline in drawer)
  const [orderMode, setOrderMode] = useState(false);
  const [orderCategoryId, setOrderCategoryId] = useState<string>('');
  const [orderDescription, setOrderDescription] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const loadMasters = async () => {
    try {
      const { data: mp } = await supabase
        .from('master_profiles')
        .select('id, user_id, rating, jobs_completed, category_ids, bio, experience_years')
        .eq('is_active', true)
        .eq('is_approved', true)
        .limit(150);
      if (!mp || mp.length === 0) { setMasters([]); setLoading(false); return; }

      const userIds = mp.map(m => m.user_id);
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, city, latitude, longitude, last_seen_at')
        .in('user_id', userIds);

      const allCatIds = [...new Set(mp.flatMap(m => m.category_ids || []))];
      const { data: cats } = allCatIds.length ? await supabase
        .from('categories').select('id, name_uz, name_ru, name_en')
        .in('id', allCatIds) : { data: [] as any[] };
      const catMap = new Map((cats || []).map((c: any) => [c.id, lang === 'ru' ? c.name_ru : lang === 'en' ? c.name_en : c.name_uz]));
      const profMap = new Map((profs || []).map(p => [p.user_id, p]));

      const result: MapMaster[] = mp.map(m => {
        const p: any = profMap.get(m.user_id);
        if (!p) return null;
        let lat = p.latitude as number | null;
        let lng = p.longitude as number | null;
        let approx = false;
        if (lat == null || lng == null) {
          const c = cityCoords[p.city || 'Toshkent'] || cityCoords['Toshkent'];
          const seed = m.id.charCodeAt(0) + m.id.charCodeAt(1);
          lat = c[0] + ((seed % 100) - 50) / 1000;
          lng = c[1] + (((seed * 7) % 100) - 50) / 1000;
          approx = true;
        }
        return {
          master_id: m.id,
          user_id: m.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          city: p.city,
          rating: m.rating,
          jobs_completed: m.jobs_completed,
          bio: m.bio,
          experience_years: m.experience_years,
          category_ids: m.category_ids || [],
          lat: lat!,
          lng: lng!,
          last_seen_at: p.last_seen_at,
          category_names: (m.category_ids || []).map((id: string) => ({ id, name: catMap.get(id) || '' })).filter(c => c.name),
          approx_location: approx,
        };
      }).filter(Boolean) as MapMaster[];

      setMasters(result);
    } finally {
      setLoading(false);
    }
  };
  reloadRef.current = loadMasters;

  useEffect(() => { loadMasters(); /* eslint-disable-next-line */ }, [lang]);

  // Realtime: live profile updates (last_seen_at, lat/lng)
  useEffect(() => {
    const channel = supabase
      .channel('live-map-profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: any) => {
        const u = payload.new;
        setMasters(prev => prev.map(m => m.user_id === u.user_id ? {
          ...m,
          last_seen_at: u.last_seen_at ?? m.last_seen_at,
          lat: u.latitude ?? m.lat,
          lng: u.longitude ?? m.lng,
        } : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Tick + occasional reload
  useEffect(() => {
    const t = setInterval(() => {
      setTick(x => x + 1);
      reloadRef.current?.();
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setFlyTarget(p);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Fetch ETA via cache-aware helper
  useEffect(() => {
    if (!selected || !userPos) { setRouteInfo(null); return; }
    let cancelled = false;
    getEta(userPos, [selected.lat, selected.lng]).then(r => {
      if (!cancelled) setRouteInfo(r);
    });
    return () => { cancelled = true; };
  }, [selected, userPos]);

  // Reset order form when drawer closes or master changes
  useEffect(() => {
    if (!selected) {
      setOrderMode(false);
      setOrderCategoryId('');
      setOrderDescription('');
      setOrderAddress('');
    } else {
      // pre-select first category
      setOrderCategoryId(selected.category_names[0]?.id || '');
    }
  }, [selected]);

  const handleQuickSubmit = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selected || !orderCategoryId || !orderDescription.trim() || !orderAddress.trim()) return;
    setSubmittingOrder(true);
    try {
      const cat = selected.category_names.find(c => c.id === orderCategoryId);
      const title = `${cat?.name || 'Xizmat'} – ${selected.full_name}`;
      const { data: orderData, error } = await supabase.from('orders').insert({
        client_id: user.id,
        master_id: selected.user_id,
        title,
        description: orderDescription.trim(),
        category_id: orderCategoryId,
        payment_method: 'cash',
        amount: 0,
        commission_amount: 0,
        master_amount: 0,
        city: selected.city || 'Toshkent',
        address: orderAddress.trim(),
        status: 'pending',
      }).select('id').single();
      if (error) throw error;

      // Notify master
      await supabase.from('notifications').insert({
        user_id: selected.user_id,
        sender_id: user.id,
        title: lang === 'ru' ? 'Новый заказ через карту' : lang === 'en' ? 'New order via map' : 'Xaritadan yangi buyurtma',
        message: `${title} — ${orderAddress.trim()}`,
        type: 'order_new',
        related_order_id: orderData?.id || null,
      });

      showNotification('success', t('orderCreated'));
      setSelected(null);
      navigate('/dashboard/client');
    } catch (err: any) {
      showNotification('error', err.message || 'Xatolik');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const visible = useMemo(() => {
    let list = masters;
    if (filter === 'online') list = list.filter(m => isUserOnline(m.last_seen_at));
    if (radius > 0 && userPos) {
      list = list.filter(m => distanceKm(userPos, [m.lat, m.lng]) <= radius);
    }
    return list;
  }, [masters, filter, radius, userPos]);

  const onlineCount = masters.filter(m => isUserOnline(m.last_seen_at)).length;
  const center: [number, number] = userPos || [41.2995, 69.2401];

  const radiusOptions: RadiusOpt[] = [0, 1, 3, 5, 10];
  const radiusLabel = (r: RadiusOpt) => r === 0
    ? (lang === 'ru' ? 'Все' : lang === 'en' ? 'All' : 'Hammasi')
    : `${r} km`;

  return (
    <Layout>
      <style>{`@keyframes lm-pulse {0%{transform:scale(1);opacity:.6}100%{transform:scale(1.8);opacity:0}}
        .leaflet-container{font-family:inherit;}`}</style>

      <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-success/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold mb-2">
                <Radio className="h-3 w-3 animate-pulse" /> LIVE
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {lang === 'ru' ? 'Карта мастеров' : lang === 'en' ? 'Masters Map' : 'Ustalar xaritasi'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {lang === 'ru' ? `${onlineCount} мастеров онлайн` : lang === 'en' ? `${onlineCount} online now` : `${onlineCount} ta usta hozir onlayn`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" className="rounded-xl" onClick={() => setFilter('all')}>
                {lang === 'ru' ? 'Все' : lang === 'en' ? 'All' : 'Hammasi'} ({masters.length})
              </Button>
              <Button variant={filter === 'online' ? 'default' : 'outline'} size="sm" className="rounded-xl gap-1.5" onClick={() => setFilter('online')}>
                <span className="w-2 h-2 rounded-full bg-success"></span>
                {lang === 'ru' ? 'Онлайн' : lang === 'en' ? 'Online' : 'Onlayn'} ({onlineCount})
              </Button>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={requestLocation}>
                <Navigation className="h-4 w-4" />
                {lang === 'ru' ? 'Я здесь' : lang === 'en' ? 'My location' : 'Mening joyim'}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              {lang === 'ru' ? 'Радиус:' : lang === 'en' ? 'Radius:' : 'Radius:'}
            </span>
            {radiusOptions.map(r => (
              <button
                key={r}
                onClick={() => { if (r > 0 && !userPos) requestLocation(); setRadius(r); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  radius === r
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:border-primary/40'
                }`}
              >
                {radiusLabel(r)}
              </button>
            ))}
            {radius > 0 && !userPos && (
              <span className="text-xs text-amber-600">⚠ {lang === 'ru' ? 'Включите геолокацию' : lang === 'en' ? 'Enable location' : 'Joylashuvni yoqing'}</span>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height: '70vh', minHeight: 480 }}>
          {loading ? (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <MapContainer center={center} zoom={userPos ? 12 : 6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FlyTo pos={flyTarget} />
              {userPos && radius > 0 && (
                <Circle center={userPos} radius={radius * 1000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 2 }} />
              )}
              {userPos && <Marker position={userPos} icon={userIcon()} />}
              {visible.map(m => {
                const avatar = m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=6366f1&color=fff&size=128`;
                return (
                  <Marker
                    key={m.master_id}
                    position={[m.lat, m.lng]}
                    icon={makeIcon(avatar, isUserOnline(m.last_seen_at))}
                    eventHandlers={{ click: () => setSelected(m) }}
                  />
                );
              })}
            </MapContainer>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {lang === 'ru' ? `Показано ${visible.length} из ${masters.length}` : lang === 'en' ? `Showing ${visible.length} of ${masters.length}` : `${masters.length} dan ${visible.length} ta ko'rsatildi`}
        </p>
      </section>

      {/* Compact Master Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-sm p-0 overflow-hidden flex flex-col">
          {selected && (() => {
            const online = isUserOnline(selected.last_seen_at);
            const avatar = selected.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.full_name)}&background=6366f1&color=fff&size=200`;
            return (
              <>
                <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
                  <SheetTitle className="text-left text-base flex items-center gap-2">
                    {orderMode && (
                      <button onClick={() => setOrderMode(false)} className="p-1 -ml-1 rounded hover:bg-muted">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}
                    {orderMode
                      ? (lang === 'ru' ? 'Быстрый заказ' : lang === 'en' ? 'Quick order' : 'Tezkor buyurtma')
                      : (lang === 'ru' ? 'Профиль' : lang === 'en' ? 'Profile' : 'Profil')}
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Compact header card */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img src={avatar} alt={selected.full_name} className="w-14 h-14 rounded-xl object-cover border border-border" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${online ? 'bg-success' : 'bg-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{selected.full_name}</h3>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-semibold">{(selected.rating || 0).toFixed(1)}</span>
                        <span className="text-muted-foreground">· {selected.jobs_completed || 0} ish</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5 ${online ? 'text-success' : 'text-muted-foreground'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                        {online
                          ? (lang === 'ru' ? 'Онлайн' : lang === 'en' ? 'Online' : 'Onlayn')
                          : (lang === 'ru' ? 'Офлайн' : lang === 'en' ? 'Offline' : 'Oflayn')}
                        {selected.city && ` · ${selected.city}`}
                      </span>
                    </div>
                  </div>

                  {!orderMode ? (
                    <>
                      {/* Categories */}
                      {selected.category_names.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selected.category_names.slice(0, 4).map(c => (
                            <span key={c.id} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{c.name}</span>
                          ))}
                        </div>
                      )}

                      {/* ETA */}
                      {userPos && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-border p-2.5">
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                              <MapPin className="h-3 w-3" />{lang === 'ru' ? 'Расстояние' : lang === 'en' ? 'Distance' : 'Masofa'}
                            </div>
                            <div className="font-bold text-sm">
                              {routeInfo ? `${routeInfo.km.toFixed(1)} km` : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            </div>
                          </div>
                          <div className="rounded-xl border border-border p-2.5">
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                              <Clock className="h-3 w-3" />{lang === 'ru' ? 'В пути' : lang === 'en' ? 'ETA' : "Yo'l vaqti"}
                            </div>
                            <div className="font-bold text-sm text-primary">
                              {routeInfo ? `~${Math.round(routeInfo.min)} daq` : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            </div>
                          </div>
                        </div>
                      )}

                      {selected.bio && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{selected.bio}</p>
                      )}

                      {selected.approx_location && (
                        <p className="text-[11px] text-amber-600">
                          ⚠ {lang === 'ru' ? 'Местоположение приблизительное.' : lang === 'en' ? 'Approximate location.' : "Joylashuv taxminiy."}
                        </p>
                      )}
                    </>
                  ) : (
                    /* Inline Quick-Order Form */
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold mb-1 block">
                          {lang === 'ru' ? 'Услуга' : lang === 'en' ? 'Service' : 'Xizmat'}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.category_names.map(c => (
                            <button
                              key={c.id}
                              onClick={() => setOrderCategoryId(c.id)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                                orderCategoryId === c.id
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold mb-1 block">
                          {lang === 'ru' ? 'Что нужно сделать?' : lang === 'en' ? 'What do you need?' : 'Nima kerak?'}
                        </label>
                        <Textarea
                          rows={3}
                          className="rounded-lg resize-none text-sm"
                          placeholder={lang === 'ru' ? 'напр. Кран течёт' : lang === 'en' ? 'e.g. Leaky faucet' : 'masalan: Kran oqyapti'}
                          value={orderDescription}
                          onChange={e => setOrderDescription(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold mb-1 block">
                          <MapPin className="h-3 w-3 inline mr-0.5" />
                          {lang === 'ru' ? 'Адрес' : lang === 'en' ? 'Address' : 'Manzil'}
                        </label>
                        <Input
                          className="rounded-lg h-10 text-sm"
                          placeholder={lang === 'ru' ? 'Улица, дом' : lang === 'en' ? 'Street, building' : "Ko'cha, uy"}
                          value={orderAddress}
                          onChange={e => setOrderAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sticky footer actions */}
                <div className="border-t border-border p-3 bg-background">
                  {!orderMode ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => navigate(`/master/${selected.master_id}`)}>
                        {lang === 'ru' ? 'Профиль' : lang === 'en' ? 'Profile' : 'Profil'}
                      </Button>
                      <Button size="sm" className="flex-1 rounded-lg gap-1.5" onClick={() => setOrderMode(true)}>
                        <MessageCircle className="h-3.5 w-3.5" />
                        {lang === 'ru' ? 'Заказать' : lang === 'en' ? 'Order' : 'Buyurtma'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full rounded-lg gap-2 h-10"
                      disabled={submittingOrder || !orderCategoryId || !orderDescription.trim() || !orderAddress.trim()}
                      onClick={handleQuickSubmit}
                    >
                      {submittingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {lang === 'ru' ? 'Отправить заказ' : lang === 'en' ? 'Send order' : 'Buyurtmani yuborish'}
                    </Button>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
