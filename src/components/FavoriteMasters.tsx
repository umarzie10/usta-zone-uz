import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import FavoriteButton from './FavoriteButton';
import { Heart, Star, Loader2 } from 'lucide-react';

export default function FavoriteMasters() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [masters, setMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data: favs } = await supabase.from('favorite_masters').select('master_profile_id').eq('client_id', user!.id);
    if (!favs || favs.length === 0) { setMasters([]); setLoading(false); return; }
    const ids = favs.map(f => f.master_profile_id);
    const { data: profs } = await supabase.from('master_profiles')
      .select('id,user_id,rating,reviews_count,jobs_completed,skills,verification_tier').in('id', ids);
    if (profs) {
      const userIds = profs.map(p => p.user_id);
      const { data: ppl } = await supabase.from('profiles').select('user_id,full_name,avatar_url,city').in('user_id', userIds);
      const pMap = new Map(ppl?.map(p => [p.user_id, p]) || []);
      setMasters(profs.map(p => ({ ...p, profile: pMap.get(p.user_id) })));
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  if (masters.length === 0) return (
    <div className="card-premium p-8 text-center">
      <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Sevimli ustalar yo'q</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {masters.map(m => (
        <div key={m.id} className="card-premium p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition"
          onClick={() => navigate(`/master/${m.id}`)}>
          <img src={m.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.profile?.full_name || 'U')}`}
            className="w-14 h-14 rounded-xl object-cover" alt="" />
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{m.profile?.full_name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {m.rating?.toFixed(1) || '0.0'} · {m.profile?.city}
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{(m.skills || []).slice(0,2).join(', ')}</p>
          </div>
          <FavoriteButton masterProfileId={m.id} size="sm" />
        </div>
      ))}
    </div>
  );
}
