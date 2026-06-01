import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MapPin, Star, CheckCircle, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface MatchMaster {
  id: string; user_id: string; full_name: string; avatar_url: string | null;
  rating: number; reviews_count: number; jobs_completed: number; experience_years: number;
  skills: string[]; city: string | null; is_verified: boolean;
  distance_km: number | null; match_score: number;
}
interface MatchResult {
  category: string | null; keywords: string[];
  price_min: number; price_max: number; reasoning: string;
  masters: MatchMaster[];
}

const fmt = (n: number) => n.toLocaleString('uz-UZ');

export default function AIMasterMatch() {
  const navigate = useNavigate();
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const run = async () => {
    if (desc.trim().length < 8) {
      toast.error('Muammoni batafsilroq yozing');
      return;
    }
    setLoading(true);
    try {
      const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { timeout: 3000 }
        );
      });
      const { data, error } = await supabase.functions.invoke('ai-match', {
        body: { description: desc, lat: coords?.lat, lng: coords?.lng },
      });
      if (error) throw error;
      setResult(data as MatchResult);
    } catch (e: any) {
      toast.error('AI xatolik: ' + (e?.message || 'qayta urinib ko\'ring'));
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    'Konditsioner ishlamayapti, sovutmayapti',
    'Vannada suv oqyapti, tezda kerak',
    'Noutbukim yonmayapti',
    'Devorlarni bo\'yash kerak, 40 kv.m',
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 reveal-on-scroll">
          <Badge className="mb-3 gap-1.5 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3.5 w-3.5" /> AI Usta Match
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black mb-3">Muammoyingizni yozing — AI ustani topadi</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sun'iy intellekt muammoni tushunadi, kategoriya aniqlaydi va eng yaqin ustalarni narx bilan taklif qiladi
          </p>
        </div>

        <div className="card-premium p-6 sm:p-8 reveal-on-scroll">
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Masalan: Konditsioner sovutmayapti, ehtimol gaz tugagan..."
            className="min-h-[100px] rounded-xl text-base resize-none mb-3"
            disabled={loading}
          />
          <div className="flex flex-wrap gap-2 mb-4">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setDesc(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground transition"
              >
                {ex}
              </button>
            ))}
          </div>
          <Button onClick={run} disabled={loading} size="lg" className="w-full rounded-xl gap-2 h-12 text-base">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> AI tahlil qilmoqda...</> : <><Wand2 className="h-5 w-5" /> Ustani topish</>}
          </Button>
        </div>

        {result && (
          <div className="mt-6 space-y-6 animate-fade-in-up">
            {/* Analysis card */}
            <div className="card-premium p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">AI tahlili</p>
                  <h3 className="text-lg font-bold mb-1">
                    {result.category || 'Aniqlanmadi'}
                  </h3>
                  {result.reasoning && <p className="text-sm text-muted-foreground">{result.reasoning}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Taxminiy narx</p>
                  <p className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {fmt(result.price_min)} – {fmt(result.price_max)} so'm
                  </p>
                </div>
              </div>
            </div>

            {/* Masters list */}
            {result.masters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.masters.map((m, i) => (
                  <div
                    key={m.id}
                    className="card-premium p-5 hover-lift cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                    onClick={() => navigate(`/master/${m.id}`)}
                  >
                    <div className="flex gap-3 mb-3">
                      <img
                        src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=6366f1&color=fff`}
                        alt={m.full_name}
                        className="w-14 h-14 rounded-2xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-semibold text-sm truncate">{m.full_name}</h4>
                          {m.is_verified && <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{m.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({m.reviews_count})</span>
                        </div>
                        {m.city && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{m.city}{m.distance_km !== null && ` · ${m.distance_km} km`}</span>
                          </div>
                        )}
                      </div>
                      <Badge className="h-fit bg-primary/10 text-primary border-0 text-[10px]">
                        {m.match_score}%
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {m.skills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{s}</span>
                      ))}
                    </div>
                    <Button size="sm" className="w-full rounded-xl text-xs">Profilni ko'rish</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Bu kategoriya bo'yicha hozircha mos usta topilmadi
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
