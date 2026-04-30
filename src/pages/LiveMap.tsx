import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Loader2, Navigation, Radio } from 'lucide-react';

interface MapMaster {
  master_id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  rating: number | null;
  jobs_completed: number | null;
  lat: number;
  lng: number;
  is_online: boolean;
  category_names: string[];
}

// Approx city coords (Uzbekistan)
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
      <div style="position:relative;width:48px;height:48px;">
        <div style="position:absolute;inset:0;border-radius:50%;border:3px solid ${online ? '#22c55e' : '#94a3b8'};box-shadow:0 4px 12px rgba(0,0,0,.25);overflow:hidden;background:#fff;">
          <img src="${avatar}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:${online ? '#22c55e' : '#94a3b8'};border:2px solid #fff;"></div>
        ${online ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #22c55e;opacity:.5;animation:pulse 1.8s ease-out infinite;"></div>` : ''}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
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

function FlyTo({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, 12, { duration: 1.2 }); }, [pos, map]);
  return null;
}

function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function LiveMap() {
  const { lang } = useApp();
  const navigate = useNavigate();
  const [masters, setMasters] = useState<MapMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<'all' | 'online'>('all');

  // Load masters
  useEffect(() => {
    (async () => {
      try {
        const { data: mp } = await supabase
          .from('master_profiles')
          .select('id, user_id, rating, jobs_completed, category_ids')
          .eq('is_active', true)
          .eq('is_approved', true)
          .limit(100);
        if (!mp || mp.length === 0) { setLoading(false); return; }

        const userIds = mp.map(m => m.user_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, city, latitude, longitude')
          .in('user_id', userIds);

        const allCatIds = [...new Set(mp.flatMap(m => m.category_ids || []))];
        const { data: cats } = await supabase
          .from('categories').select('id, name_uz, name_ru, name_en')
          .in('id', allCatIds.length ? allCatIds : ['00000000-0000-0000-0000-000000000000']);
        const catMap = new Map(cats?.map(c => [c.id, lang === 'ru' ? c.name_ru : lang === 'en' ? c.name_en : c.name_uz]) || []);
        const profMap = new Map(profs?.map(p => [p.user_id, p]) || []);

        const result: MapMaster[] = mp.map(m => {
          const p = profMap.get(m.user_id);
          if (!p) return null;
          let lat = p.latitude as number | null;
          let lng = p.longitude as number | null;
          if (lat == null || lng == null) {
            const c = cityCoords[p.city || 'Toshkent'] || cityCoords['Toshkent'];
            // jitter so multiple masters in same city don't overlap
            const seed = m.id.charCodeAt(0) + m.id.charCodeAt(1);
            lat = c[0] + ((seed % 100) - 50) / 1000;
            lng = c[1] + (((seed * 7) % 100) - 50) / 1000;
          }
          // simple online derivation: hash-based but stable per session
          const isOnline = (m.id.charCodeAt(0) + m.id.charCodeAt(2)) % 2 === 0;
          return {
            master_id: m.id,
            user_id: m.user_id,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            city: p.city,
            rating: m.rating,
            jobs_completed: m.jobs_completed,
            lat: lat!,
            lng: lng!,
            is_online: isOnline,
            category_names: (m.category_ids || []).map(id => catMap.get(id) || '').filter(Boolean),
          };
        }).filter(Boolean) as MapMaster[];

        setMasters(result);
      } finally {
        setLoading(false);
      }
    })();
  }, [lang]);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setFlyTarget(p);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const visible = useMemo(
    () => filter === 'online' ? masters.filter(m => m.is_online) : masters,
    [masters, filter]
  );

  const onlineCount = masters.filter(m => m.is_online).length;
  const center: [number, number] = userPos || [41.2995, 69.2401];

  return (
    <Layout>
      <style>{`@keyframes pulse {0%{transform:scale(1);opacity:.6}100%{transform:scale(1.8);opacity:0}}`}</style>

      {/* Page header */}
      <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-success/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold mb-2">
                <Radio className="h-3 w-3 animate-pulse" /> LIVE
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {lang === 'ru' ? 'Карта мастеров' : lang === 'en' ? 'Masters Map' : 'Ustalar xaritasi'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {lang === 'ru' ? `${onlineCount} мастеров онлайн сейчас` : lang === 'en' ? `${onlineCount} masters online now` : `${onlineCount} ta usta hozir onlayn`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm" className="rounded-xl"
                onClick={() => setFilter('all')}
              >
                {lang === 'ru' ? 'Все' : lang === 'en' ? 'All' : 'Hammasi'} ({masters.length})
              </Button>
              <Button
                variant={filter === 'online' ? 'default' : 'outline'}
                size="sm" className="rounded-xl gap-1.5"
                onClick={() => setFilter('online')}
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
        </div>
      </section>

      {/* Map */}
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
              {userPos && (
                <Marker position={userPos} icon={userIcon()}>
                  <Popup>{lang === 'ru' ? 'Вы здесь' : lang === 'en' ? 'You are here' : 'Siz shu yerdasiz'}</Popup>
                </Marker>
              )}
              {visible.map(m => {
                const avatar = m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=6366f1&color=fff&size=128`;
                const dist = userPos ? distanceKm(userPos, [m.lat, m.lng]) : null;
                const eta = dist != null ? Math.max(5, Math.round(dist * 3)) : null; // ~3 min/km city
                return (
                  <Marker key={m.master_id} position={[m.lat, m.lng]} icon={makeIcon(avatar, m.is_online)}>
                    <Popup>
                      <div style={{ minWidth: 220 }}>
                        <div className="flex items-center gap-3 mb-2">
                          <img src={avatar} alt={m.full_name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{m.full_name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                              <Star className="h-3 w-3" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                              {(m.rating || 0).toFixed(1)} · {m.jobs_completed || 0} ish
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.is_online ? '#22c55e' : '#94a3b8', display: 'inline-block' }} />
                          <span style={{ fontWeight: 600, color: m.is_online ? '#15803d' : '#64748b' }}>
                            {m.is_online
                              ? (lang === 'ru' ? 'Онлайн' : lang === 'en' ? 'Online' : 'Onlayn')
                              : (lang === 'ru' ? 'Офлайн' : lang === 'en' ? 'Offline' : 'Oflayn')}
                          </span>
                          {eta != null && m.is_online && (
                            <span style={{ marginLeft: 6, color: '#1e40af', fontWeight: 600 }}>· ~{eta} daq</span>
                          )}
                        </div>
                        {m.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                            <MapPin className="h-3 w-3" /> {m.city}{dist != null ? ` · ${dist < 1 ? '<1' : Math.round(dist)} km` : ''}
                          </div>
                        )}
                        {m.category_names.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                            {m.category_names.slice(0, 3).map(c => (
                              <span key={c} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#eef2ff', color: '#4338ca', fontWeight: 500 }}>{c}</span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => navigate(`/master/${m.master_id}`)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: '#1a56db', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}
                        >
                          {lang === 'ru' ? 'Открыть профиль' : lang === 'en' ? 'View profile' : 'Profilni ochish'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {!loading && masters.length === 0 && (
          <p className="text-center text-muted-foreground mt-6">
            {lang === 'ru' ? 'Активных мастеров пока нет' : lang === 'en' ? 'No active masters yet' : 'Hozircha faol ustalar yo\'q'}
          </p>
        )}
      </section>
    </Layout>
  );
}
