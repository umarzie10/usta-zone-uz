import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Star, MapPin, Loader2, Navigation, Radio, Clock, Briefcase, MessageCircle } from 'lucide-react';

const ONLINE_THRESHOLD_MS = 90_000; // 90s

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
  lat: number;
  lng: number;
  last_seen_at: string | null;
  category_names: string[];
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

const isOnline = (lastSeen: string | null) =>
  !!lastSeen && Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;

function makeIcon(avatar: string, online: boolean) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:48px;height:48px;cursor:pointer;">
        <div style="position:absolute;inset:0;border-radius:50%;border:3px solid ${online ? '#22c55e' : '#94a3b8'};box-shadow:0 4px 12px rgba(0,0,0,.25);overflow:hidden;background:#fff;">
          <img src="${avatar}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:${online ? '#22c55e' : '#94a3b8'};border:2px solid #fff;"></div>
        ${online ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #22c55e;opacity:.5;animation:lm-pulse 1.8s ease-out infinite;"></div>` : ''}
      </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function userIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
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
  const { lang } = useApp();
  const navigate = useNavigate();
  const [masters, setMasters] = useState<MapMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<'all' | 'online'>('all');
  const [radius, setRadius] = useState<RadiusOpt>(0);
  const [selected, setSelected] = useState<MapMaster | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ km: number; min: number } | null>(null);
  const [, setTick] = useState(0); // forces re-render every 30s for online status freshness
  const reloadRef = useRef<() => void>();

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
          lat: lat!,
          lng: lng!,
          last_seen_at: p.last_seen_at,
          category_names: (m.category_ids || []).map((id: string) => catMap.get(id) || '').filter(Boolean),
          approx_location: approx,
        };
      }).filter(Boolean) as MapMaster[];

      setMasters(result);
    } finally {
      setLoading(false);
    }
  };
  reloadRef.current = loadMasters;

  // Initial load + react to language
  useEffect(() => { loadMasters(); /* eslint-disable-next-line */ }, [lang]);

  // Realtime subscription on profiles (last_seen_at, lat/lng)
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

  // Polling fallback (every 30s) + tick to refresh online state
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

  // Fetch real OSRM route when a master is selected
  useEffect(() => {
    if (!selected || !userPos) { setRouteInfo(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${selected.lng},${selected.lat}?overview=false`;
        const res = await fetch(url);
        const j = await res.json();
        if (!cancelled && j.routes?.[0]) {
          setRouteInfo({
            km: j.routes[0].distance / 1000,
            min: j.routes[0].duration / 60,
          });
        }
      } catch {
        // fallback to straight-line
        const km = distanceKm(userPos, [selected.lat, selected.lng]);
        if (!cancelled) setRouteInfo({ km, min: km * 3 });
      }
    })();
    return () => { cancelled = true; };
  }, [selected, userPos]);

  const visible = useMemo(() => {
    let list = masters;
    if (filter === 'online') list = list.filter(m => isOnline(m.last_seen_at));
    if (radius > 0 && userPos) {
      list = list.filter(m => distanceKm(userPos, [m.lat, m.lng]) <= radius);
    }
    return list;
  }, [masters, filter, radius, userPos]);

  const onlineCount = masters.filter(m => isOnline(m.last_seen_at)).length;
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
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm" className="rounded-xl" onClick={() => setFilter('all')}
              >
                {lang === 'ru' ? 'Все' : lang === 'en' ? 'All' : 'Hammasi'} ({masters.length})
              </Button>
              <Button
                variant={filter === 'online' ? 'default' : 'outline'}
                size="sm" className="rounded-xl gap-1.5" onClick={() => setFilter('online')}
              >
                <span className="w-2 h-2 rounded-full bg-success"></span>
                {lang === 'ru' ? 'Онлайн' : lang === 'en' ? 'Online' : 'Onlayn'} ({onlineCount})
              </Button>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={requestLocation}>
                <Navigation className="h-4 w-4" />
                {lang === 'ru' ? 'Я здесь' : lang === 'en' ? 'My location' : 'Mening joyim'}
              </Button>
            </div>
          </div>

          {/* Radius filter */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              {lang === 'ru' ? 'Радиус:' : lang === 'en' ? 'Radius:' : 'Radius:'}
            </span>
            {radiusOptions.map(r => (
              <button
                key={r}
                onClick={() => {
                  if (r > 0 && !userPos) requestLocation();
                  setRadius(r);
                }}
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
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyTo pos={flyTarget} />
              {userPos && radius > 0 && (
                <Circle center={userPos} radius={radius * 1000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 2 }} />
              )}
              {userPos && (
                <Marker position={userPos} icon={userIcon()} />
              )}
              {visible.map(m => {
                const avatar = m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=6366f1&color=fff&size=128`;
                return (
                  <Marker
                    key={m.master_id}
                    position={[m.lat, m.lng]}
                    icon={makeIcon(avatar, isOnline(m.last_seen_at))}
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

      {/* Master Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selected && (() => {
            const online = isOnline(selected.last_seen_at);
            const avatar = selected.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.full_name)}&background=6366f1&color=fff&size=256`;
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-left">
                    {lang === 'ru' ? 'Профиль мастера' : lang === 'en' ? 'Master Profile' : 'Usta profili'}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={avatar} alt={selected.full_name} className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
                      <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${online ? 'bg-success' : 'bg-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{selected.full_name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-semibold">{(selected.rating || 0).toFixed(1)}</span>
                        <span className="text-muted-foreground">· {selected.jobs_completed || 0} ish</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 ${online ? 'text-success' : 'text-muted-foreground'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-success' : 'bg-muted-foreground'}`} />
                        {online
                          ? (lang === 'ru' ? 'Онлайн сейчас' : lang === 'en' ? 'Online now' : 'Hozir onlayn')
                          : (lang === 'ru' ? 'Не в сети' : lang === 'en' ? 'Offline' : 'Oflayn')}
                      </span>
                    </div>
                  </div>

                  {selected.category_names.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.category_names.slice(0, 5).map(c => (
                        <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{c}</span>
                      ))}
                    </div>
                  )}

                  {/* ETA card */}
                  {userPos && (
                    <div className="card-premium p-4 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{lang === 'ru' ? 'Расстояние' : lang === 'en' ? 'Distance' : 'Masofa'}
                        </div>
                        <div className="font-bold text-lg">
                          {routeInfo ? `${routeInfo.km.toFixed(1)} km` : <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />{lang === 'ru' ? 'Время в пути' : lang === 'en' ? 'ETA' : 'Yo\'l vaqti'}
                        </div>
                        <div className="font-bold text-lg text-primary">
                          {routeInfo ? `~${Math.round(routeInfo.min)} daq` : <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                      </div>
                    </div>
                  )}

                  {selected.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selected.bio}</p>
                  )}

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {selected.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selected.city}</span>}
                    {selected.experience_years ? <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{selected.experience_years} yil</span> : null}
                  </div>

                  {selected.approx_location && (
                    <p className="text-xs text-amber-600">
                      ⚠ {lang === 'ru' ? 'Точное местоположение не указано — показано приблизительно по городу.' : lang === 'en' ? 'Exact location not set — approximate by city.' : 'Aniq joylashuv kiritilmagan — shahar bo\'yicha taxminiy.'}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 rounded-xl" onClick={() => navigate(`/master/${selected.master_id}`)}>
                      {lang === 'ru' ? 'Открыть профиль' : lang === 'en' ? 'View profile' : 'Profilni ochish'}
                    </Button>
                    <Button variant="outline" className="rounded-xl gap-1.5" onClick={() => navigate(`/order/create?master=${selected.master_id}`)}>
                      <MessageCircle className="h-4 w-4" />
                      {lang === 'ru' ? 'Заказать' : lang === 'en' ? 'Order' : 'Buyurtma'}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
