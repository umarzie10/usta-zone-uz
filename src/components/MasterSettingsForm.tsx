import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Upload, CheckCircle2, MapPin, Clock, FileText, Briefcase, ChevronDown, ChevronRight } from 'lucide-react';
import { uzbekRegions } from '@/lib/demoData';

interface Cat { id: string; name_uz: string; parent_id: string | null; }

const WEEK_DAYS = [
  { v: 'mon', l: 'Du' }, { v: 'tue', l: 'Se' }, { v: 'wed', l: 'Ch' },
  { v: 'thu', l: 'Pa' }, { v: 'fri', l: 'Ju' }, { v: 'sat', l: 'Sh' }, { v: 'sun', l: 'Ya' },
];

export default function MasterSettingsForm({ onSaved }: { onSaved?: () => void }) {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mp, setMp] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    categoryIds: [] as string[],
    subcategoryIds: [] as string[],
    region: 'Toshkent shahri',
    city: 'Toshkent',
    radiusKm: 20,
    workDays: ['mon','tue','wed','thu','fri','sat'] as string[],
    workStart: '09:00',
    workEnd: '18:00',
    acceptsEmergency: false,
  });

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: mArr }, { data: p }] = await Promise.all([
      supabase.from('categories').select('id,name_uz,parent_id').order('name_uz'),
      supabase.rpc('get_my_master_profile'),
      supabase.from('profiles').select('region,city').eq('user_id', user!.id).maybeSingle(),
    ]);
    const m = Array.isArray(mArr) ? mArr[0] : mArr;
    setCats(c || []);
    setMp(m);
    setProfile(p);
    if (m) {
      setForm(f => ({
        ...f,
        categoryIds: m.category_ids || [],
        subcategoryIds: m.subcategory_ids || [],
        radiusKm: m.service_radius_km || 20,
        workDays: m.work_days?.length ? m.work_days : f.workDays,
        workStart: m.work_start?.slice(0,5) || '09:00',
        workEnd: m.work_end?.slice(0,5) || '18:00',
        acceptsEmergency: !!m.accepts_emergency,
        region: p?.region || 'Toshkent shahri',
        city: p?.city || 'Toshkent',
      }));
    }
    setLoading(false);
  };

  const parents = useMemo(() => cats.filter(c => !c.parent_id), [cats]);
  const subsOf = (id: string) => cats.filter(c => c.parent_id === id);

  const toggleCat = (id: string) => setForm(f => ({
    ...f,
    categoryIds: f.categoryIds.includes(id) ? f.categoryIds.filter(x => x !== id) : [...f.categoryIds, id],
  }));
  const toggleSub = (id: string) => setForm(f => ({
    ...f,
    subcategoryIds: f.subcategoryIds.includes(id) ? f.subcategoryIds.filter(x => x !== id) : [...f.subcategoryIds, id],
  }));
  const toggleDay = (d: string) => setForm(f => ({
    ...f,
    workDays: f.workDays.includes(d) ? f.workDays.filter(x => x !== d) : [...f.workDays, d],
  }));

  const uploadDoc = async (key: string, file: File) => {
    const path = `${user!.id}/${key}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('verification-docs').upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const handleSave = async () => {
    if (!user || !mp) return;
    setSaving(true);
    try {
      let id_document_url = mp.id_document_url;
      let selfie_url = mp.selfie_url;
      if (idFile) id_document_url = await uploadDoc('id', idFile);
      if (selfieFile) selfie_url = await uploadDoc('selfie', selfieFile);

      await Promise.all([
        supabase.from('master_profiles').update({
          category_ids: form.categoryIds,
          subcategory_ids: form.subcategoryIds,
          service_radius_km: form.radiusKm,
          work_days: form.workDays,
          work_start: form.workStart,
          work_end: form.workEnd,
          accepts_emergency: form.acceptsEmergency,
          id_document_url,
          selfie_url,
        }).eq('user_id', user.id),
        supabase.from('profiles').update({
          region: form.region,
          city: form.city,
        }).eq('user_id', user.id),
      ]);

      showNotification('success', 'Sozlamalar saqlandi');
      setIdFile(null); setSelfieFile(null);
      onSaved?.();
      load();
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  if (!mp) return <div className="card-premium p-6 text-sm text-muted-foreground">Usta profili topilmadi.</div>;

  return (
    <div className="space-y-4">
      {/* Categories */}
      <div className="card-premium p-4 sm:p-6">
        <h3 className="font-bold flex items-center gap-2 mb-3"><Briefcase className="h-4 w-4 text-primary" /> Xizmatlar</h3>
        <p className="text-xs text-muted-foreground mb-3">Asosiy kategoriya va subkategoriyalarni tanlang</p>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {parents.map(p => {
            const subs = subsOf(p.id);
            const active = form.categoryIds.includes(p.id);
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className={`rounded-xl border ${active ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center gap-2 p-2.5">
                  <button type="button" onClick={() => toggleCat(p.id)}
                    className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center ${active ? 'bg-primary border-primary' : 'border-border'}`}>
                    {active && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </button>
                  <button type="button" onClick={() => setExpanded(isOpen ? null : p.id)} className="flex-1 flex items-center justify-between text-left">
                    <span className="text-sm font-medium truncate">{p.name_uz}</span>
                    {subs.length > 0 && (isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />)}
                  </button>
                </div>
                {isOpen && subs.length > 0 && (
                  <div className="border-t border-border p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {subs.map(s => {
                      const on = form.subcategoryIds.includes(s.id);
                      return (
                        <button key={s.id} type="button" onClick={() => toggleSub(s.id)}
                          className={`text-left text-xs px-2.5 py-1.5 rounded-lg border ${on ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground'}`}>
                          {s.name_uz}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div className="card-premium p-4 sm:p-6 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Joylashuv va radius</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Viloyat</Label>
            <select value={form.region} onChange={e => setForm({...form, region: e.target.value})}
              className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm">
              {uzbekRegions.map((r: any) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Shahar / tuman</Label>
            <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="mt-1 h-10 rounded-xl" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <Label>Xizmat radiusi</Label>
            <span className="font-bold text-primary">{form.radiusKm} km</span>
          </div>
          <input type="range" min={1} max={100} value={form.radiusKm}
            onChange={e => setForm({...form, radiusKm: +e.target.value})}
            className="w-full accent-primary" />
        </div>
      </div>

      {/* Schedule */}
      <div className="card-premium p-4 sm:p-6 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Ish vaqti</h3>
        <div className="flex flex-wrap gap-1.5">
          {WEEK_DAYS.map(d => {
            const on = form.workDays.includes(d.v);
            return (
              <button key={d.v} type="button" onClick={() => toggleDay(d.v)}
                className={`w-10 h-10 rounded-xl text-xs font-bold border-2 ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>
                {d.l}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Boshlanish</Label>
            <Input type="time" value={form.workStart} onChange={e => setForm({...form, workStart: e.target.value})} className="mt-1 h-10 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs">Tugash</Label>
            <Input type="time" value={form.workEnd} onChange={e => setForm({...form, workEnd: e.target.value})} className="mt-1 h-10 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div className="min-w-0 pr-2">
            <p className="text-sm font-medium">Shoshilinch buyurtmalar</p>
            <p className="text-xs text-muted-foreground">24/7 favqulodda chaqiruvlarni qabul qilish</p>
          </div>
          <Switch checked={form.acceptsEmergency} onCheckedChange={v => setForm({...form, acceptsEmergency: v})} />
        </div>
      </div>

      {/* Documents */}
      <div className="card-premium p-4 sm:p-6 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Hujjatlar</h3>
        <p className="text-xs text-muted-foreground">Yangi hujjat yuklasangiz, avvalgisi almashtiriladi</p>
        {([
          { key: 'id', label: 'Passport / ID', file: idFile, set: setIdFile, existing: mp.id_document_url },
          { key: 'selfie', label: 'Selfie (passport bilan)', file: selfieFile, set: setSelfieFile, existing: mp.selfie_url },
        ] as any[]).map(item => (
          <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition">
            <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {item.file ? item.file.name : item.existing ? 'Yuklangan ✓ — yangilash uchun tanlang' : 'Faylni tanlang'}
              </p>
            </div>
            <input type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => item.set(e.target.files?.[0] || null)} />
            {(item.file || item.existing) && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
          </label>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl btn-hero gap-2 sticky bottom-4 z-10 shadow-lg">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Barcha o'zgarishlarni saqlash
      </Button>
    </div>
  );
}
