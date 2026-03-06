import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Loader2, Navigation } from 'lucide-react';

interface NearbyMaster {
  master_id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  rating: number | null;
  jobs_completed: number | null;
  distance: number; // km
  category_names: string[];
}

export default function NearestMasters() {
  const { lang, t } = useApp();
  const navigate = useNavigate();
  const [masters, setMasters] = useState<NearbyMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationDenied(false);
      },
      () => {
        setLocationDenied(true);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!userCoords) return;

    (async () => {
      try {
        // Get all active masters with their profiles
        const { data: masterProfiles } = await supabase
          .from('master_profiles')
          .select('id, user_id, rating, jobs_completed, category_ids, is_active')
          .eq('is_active', true)
          .eq('is_approved', true)
          .order('rating', { ascending: false })
          .limit(50);

        if (!masterProfiles || masterProfiles.length === 0) { setLoading(false); return; }

        const userIds = masterProfiles.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, city, latitude, longitude')
          .in('user_id', userIds);

        // Get categories
        const allCatIds = [...new Set(masterProfiles.flatMap(m => m.category_ids || []))];
        const { data: cats } = await supabase.from('categories').select('id, name_uz, name_ru, name_en').in('id', allCatIds);
        const catMap = new Map(cats?.map(c => [c.id, lang === 'ru' ? c.name_ru : lang === 'en' ? c.name_en : c.name_uz]) || []);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Calculate distance and sort
        const withDistance: NearbyMaster[] = masterProfiles
          .map(mp => {
            const prof = profileMap.get(mp.user_id);
            if (!prof) return null;

            let distance = 999;
            if (prof.latitude && prof.longitude) {
              distance = getDistanceKm(userCoords.lat, userCoords.lng, prof.latitude, prof.longitude);
            } else {
              // Approximate by city name
              distance = getCityDistance(prof.city, userCoords);
            }

            return {
              master_id: mp.id,
              full_name: prof.full_name,
              avatar_url: prof.avatar_url,
              city: prof.city,
              rating: mp.rating,
              jobs_completed: mp.jobs_completed,
              distance,
              category_names: (mp.category_ids || []).map(id => catMap.get(id) || '').filter(Boolean),
            };
          })
          .filter(Boolean)
          .sort((a, b) => (a!.distance - b!.distance)) as NearbyMaster[];

        setMasters(withDistance.slice(0, 3));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [userCoords, lang]);

  if (locationDenied && masters.length === 0) {
    return null; // Don't show if location denied
  }

  return (
    <section className="section-padding max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success font-semibold text-sm mb-3">
          <Navigation className="h-4 w-4" />
          {lang === 'ru' ? 'Рядом с вами' : lang === 'en' ? 'Near you' : 'Sizga yaqin'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black">
          {lang === 'ru' ? 'Ближайшие мастера' : lang === 'en' ? 'Nearest Masters' : 'Eng yaqin ustalar'}
        </h2>
      </div>

      {!userCoords && !loading && (
        <div className="text-center">
          <Button onClick={requestLocation} className="rounded-xl btn-hero gap-2">
            <MapPin className="h-4 w-4" />
            {lang === 'ru' ? 'Определить местоположение' : lang === 'en' ? 'Detect my location' : 'Joylashuvimni aniqlash'}
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {masters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {masters.map((m, i) => (
            <div key={m.master_id} className="card-premium p-5 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=6366f1&color=fff&size=128`}
                  alt={m.full_name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{m.full_name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{m.city || '—'}</span>
                    <span className="text-success font-semibold ml-1">~{m.distance < 1 ? '<1' : Math.round(m.distance)} km</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="badge-rating">
                  <Star className="h-3.5 w-3.5 star-filled" />
                  {(m.rating || 0).toFixed(1)}
                </div>
                <span className="text-xs text-muted-foreground">{m.jobs_completed || 0} {t('jobs')}</span>
              </div>
              {m.category_names.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {m.category_names.slice(0, 2).map(cn => (
                    <span key={cn} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{cn}</span>
                  ))}
                </div>
              )}
              <Button
                className="w-full rounded-xl"
                size="sm"
                onClick={() => navigate(`/master/${m.master_id}`)}
              >
                {t('viewProfile')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Approximate city coordinates for Uzbekistan cities
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

function getCityDistance(city: string | null, userCoords: { lat: number; lng: number }): number {
  if (!city) return 50;
  const coords = cityCoords[city];
  if (!coords) return 30;
  return getDistanceKm(userCoords.lat, userCoords.lng, coords[0], coords[1]);
}
