import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Heart, Loader2 } from 'lucide-react';

interface Props { masterProfileId: string; size?: 'sm' | 'md' }

export default function FavoriteButton({ masterProfileId, size = 'md' }: Props) {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase.from('favorite_masters').select('id').eq('client_id', user.id).eq('master_profile_id', masterProfileId).maybeSingle()
      .then(({ data }) => { setFav(!!data); setChecking(false); });
  }, [user, masterProfileId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { showNotification('error', 'Avval tizimga kiring'); return; }
    setLoading(true);
    try {
      if (fav) {
        await supabase.from('favorite_masters').delete().eq('client_id', user.id).eq('master_profile_id', masterProfileId);
        setFav(false);
      } else {
        await supabase.from('favorite_masters').insert({ client_id: user.id, master_profile_id: masterProfileId });
        setFav(true);
      }
    } catch (err: any) { showNotification('error', err.message); } finally { setLoading(false); }
  };

  const sizeCls = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconCls = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button onClick={toggle} disabled={loading || checking}
      className={`${sizeCls} rounded-full flex items-center justify-center transition-all ${fav ? 'bg-red-500/15 text-red-500' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
      aria-label="Sevimli">
      {loading ? <Loader2 className={`${iconCls} animate-spin`} /> : <Heart className={`${iconCls} ${fav ? 'fill-current' : ''}`} />}
    </button>
  );
}
