import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  User, Phone, Mail, Lock, Eye, EyeOff, Loader2, Check,
  ChevronLeft, ChevronRight, Briefcase, MapPin, Award, Image as ImageIcon, Upload,
  FileText, Clock, CreditCard, Shield, AlertCircle,
} from 'lucide-react';
import { uzbekRegions } from '@/lib/demoData';

interface Cat {
  id: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  parent_id: string | null;
}

const EXPERIENCE_OPTIONS = [
  { value: 1, label: '0-1 yil' },
  { value: 2, label: '1-3 yil' },
  { value: 4, label: '3-5 yil' },
  { value: 7, label: '5-10 yil' },
  { value: 12, label: '10+ yil' },
];

const WEEK_DAYS = [
  { v: 'mon', l: 'Du' }, { v: 'tue', l: 'Se' }, { v: 'wed', l: 'Ch' },
  { v: 'thu', l: 'Pa' }, { v: 'fri', l: 'Ju' }, { v: 'sat', l: 'Sh' }, { v: 'sun', l: 'Ya' },
];

const STEPS = [
  { key: 'account', title: 'Hisob', icon: User },
  { key: 'categories', title: 'Xizmatlar', icon: Briefcase },
  { key: 'location', title: 'Joylashuv', icon: MapPin },
  { key: 'experience', title: 'Tajriba', icon: Award },
  { key: 'schedule', title: 'Ish vaqti', icon: Clock },
  { key: 'documents', title: 'Hujjatlar', icon: FileText },
  { key: 'payment', title: 'To\'lov', icon: CreditCard },
  { key: 'profile', title: 'Profil', icon: ImageIcon },
  { key: 'agreement', title: 'Rozilik', icon: Shield },
] as const;

export default function RegisterMaster() {
  const { signUp, signIn } = useAuth();
  const { lang, showNotification } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [cats, setCats] = useState<Cat[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', password: '',
    categoryIds: [] as string[],
    subcategoryIds: [] as string[],
    region: 'Toshkent shahri', city: 'Toshkent',
    radiusKm: 20,
    experienceYears: 2,
    about: '',
    workDays: ['mon','tue','wed','thu','fri','sat'] as string[],
    workStart: '09:00',
    workEnd: '18:00',
    acceptsEmergency: false,
    cardNumber: '',
    bankAccount: '',
    taxInfo: '',
    agreedToTerms: false,
    agreedToPrivacy: false,
  });

  useEffect(() => {
    supabase.from('categories').select('id, name_uz, name_ru, name_en, parent_id').order('order_num').order('name_uz')
      .then(({ data }) => setCats((data as Cat[]) || []));
  }, []);

  const nameOf = (c: Cat) => lang === 'ru' ? c.name_ru : lang === 'en' ? c.name_en : c.name_uz;
  const parents = cats.filter(c => !c.parent_id);
  const subsOf = (id: string) => cats.filter(c => c.parent_id === id);
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const toggleCat = (id: string) => {
    const selected = form.categoryIds.includes(id);
    setForm(f => ({
      ...f,
      categoryIds: selected ? f.categoryIds.filter(x => x !== id) : [...f.categoryIds, id],
      subcategoryIds: selected ? f.subcategoryIds.filter(sid => !subsOf(id).some(s => s.id === sid)) : f.subcategoryIds,
    }));
  };
  const toggleSub = (id: string) =>
    setForm(f => ({
      ...f,
      subcategoryIds: f.subcategoryIds.includes(id)
        ? f.subcategoryIds.filter(x => x !== id)
        : [...f.subcategoryIds, id],
    }));
  const toggleDay = (d: string) =>
    setForm(f => ({ ...f, workDays: f.workDays.includes(d) ? f.workDays.filter(x => x !== d) : [...f.workDays, d] }));

  const pickFile = (file: File, setter: (f: File) => void, previewSetter?: (s: string) => void) => {
    setter(file);
    if (previewSetter) {
      const r = new FileReader();
      r.onload = e => previewSetter(e.target?.result as string);
      r.readAsDataURL(file);
    }
  };

  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        if (!form.fullName.trim()) return 'Ism va familiyani kiriting';
        if (form.phone.length < 9) return 'Telefon raqamni to\'g\'ri kiriting';
        if (!form.email.includes('@')) return 'Email manzilni to\'g\'ri kiriting';
        if (form.password.length < 6) return 'Parol kamida 6 belgi bo\'lishi kerak';
        return null;
      case 1:
        if (form.categoryIds.length === 0) return 'Kamida bitta kategoriya tanlang';
        return null;
      case 2:
        if (!form.region) return 'Viloyatni tanlang';
        if (!form.city.trim()) return 'Tuman / shahar nomini kiriting';
        return null;
      case 4:
        if (form.workDays.length === 0) return 'Kamida bitta ish kunini tanlang';
        return null;
      case 8:
        if (!form.agreedToTerms || !form.agreedToPrivacy) return 'Shartlarga rozilik bering';
        return null;
      default:
        return null;
    }
  };

  const next = () => {
    const err = validateStep();
    if (err) return showNotification('error', err);
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };
  const back = () => step > 0 && setStep(step - 1);

  const uploadOne = async (bucket: string, userId: string, file: File, prefix: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return null;
    if (bucket === 'verification-docs') return path; // private bucket, store path
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  const submit = async () => {
    const err = validateStep();
    if (err) return showNotification('error', err);
    setLoading(true);
    try {
      await signUp(form.email, form.password, {
        full_name: form.fullName,
        phone: form.phone,
        city: form.city,
        region: form.region,
        role: 'master',
      });
      await signIn(form.email, form.password).catch(() => {});
      const { data: { user: nu } } = await supabase.auth.getUser();
      if (!nu) throw new Error('Foydalanuvchi yaratilmadi');

      let avatarUrl: string | null = null;
      if (avatarFile) avatarUrl = await uploadOne('avatars', nu.id, avatarFile, 'avatar');
      if (avatarUrl) await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', nu.id);

      const idUrl = idFile ? await uploadOne('verification-docs', nu.id, idFile, 'id') : null;
      const selfieUrl = selfieFile ? await uploadOne('verification-docs', nu.id, selfieFile, 'selfie') : null;
      const certUrls: string[] = [];
      for (const f of certFiles) {
        const u = await uploadOne('verification-docs', nu.id, f, 'cert');
        if (u) certUrls.push(u);
      }
      const portfolioUrls: string[] = [];
      for (const f of portfolioFiles) {
        const u = await uploadOne('portfolio', nu.id, f, 'portfolio');
        if (u) portfolioUrls.push(u);
      }

      await supabase.from('master_profiles').insert({
        user_id: nu.id,
        category_ids: form.categoryIds,
        subcategory_ids: form.subcategoryIds,
        experience_years: form.experienceYears,
        skills: [],
        bio: form.about || null,
        service_radius_km: form.radiusKm,
        work_days: form.workDays,
        work_start: form.workStart,
        work_end: form.workEnd,
        accepts_emergency: form.acceptsEmergency,
        id_document_url: idUrl,
        selfie_url: selfieUrl,
        certificate_urls: certUrls,
        portfolio_urls: portfolioUrls,
        card_number: form.cardNumber || null,
        bank_account: form.bankAccount || null,
        tax_info: form.taxInfo || null,
        agreed_to_terms: form.agreedToTerms,
        agreed_to_privacy: form.agreedToPrivacy,
        is_active: true,
      });

      showNotification('success', 'Ro\'yxatdan o\'tish yakunlandi!');
      navigate('/dashboard/master');
    } catch (e: any) {
      showNotification('error', e.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout noFooter>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black mb-2">Usta sifatida ro'yxatdan o'tish</h1>
          <p className="text-muted-foreground text-sm">Profilingizni bosqichma-bosqich to'ldiring</p>
        </div>

        {/* Stepper */}
        <div className="mb-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3">
            {STEPS.map((s, i) => {
              const SIcon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={s.key} className="flex items-center shrink-0">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isDone ? 'bg-success text-success-foreground' :
                    isActive ? 'bg-primary text-primary-foreground scale-110 shadow-lg' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : <SIcon className="h-3.5 w-3.5" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-3 sm:w-6 h-0.5 mx-0.5 ${isDone ? 'bg-success' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">{step + 1}/{STEPS.length}: {STEPS[step].title}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="card-premium p-5 sm:p-7 reveal">
          {/* Step 0 - Account */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Ism va familiya</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10 h-11 rounded-xl" placeholder="Jasur Toshmatov"
                    value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Telefon raqam</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10 h-11 rounded-xl" placeholder="+998 90 000 00 00"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" className="pl-10 h-11 rounded-xl" placeholder="jasur@example.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Parol</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPass ? 'text' : 'password'} className="pl-10 pr-10 h-11 rounded-xl" placeholder="••••••••"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Kamida 6 belgi</p>
              </div>
            </div>
          )}

          {/* Step 1 - Categories & subcategories */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Kategoriyani tanlang, keyin ochiladigan ro'yxatdan aniq xizmatlarni belgilang.
              </p>
              {parents.map(cat => {
                const selected = form.categoryIds.includes(cat.id);
                const subs = subsOf(cat.id);
                const isExpanded = expandedCat === cat.id;
                const chosenSubCount = subs.filter(s => form.subcategoryIds.includes(s.id)).length;
                return (
                  <div key={cat.id} className={`rounded-xl border-2 transition ${selected ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <button type="button" onClick={() => { toggleCat(cat.id); setExpandedCat(isExpanded ? null : cat.id); }}
                      className="w-full flex items-center gap-3 p-3 text-left">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${selected ? 'bg-primary border-primary' : 'border-border'}`}>
                        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className="flex-1 font-semibold text-sm">{nameOf(cat)}</span>
                      {chosenSubCount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">{chosenSubCount}</span>
                      )}
                      {subs.length > 0 && <ChevronRight className={`h-4 w-4 transition ${isExpanded ? 'rotate-90' : ''}`} />}
                    </button>
                    {selected && isExpanded && subs.length > 0 && (
                      <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 border-t pt-2">
                        {subs.map(s => {
                          const sel = form.subcategoryIds.includes(s.id);
                          return (
                            <button key={s.id} type="button" onClick={() => toggleSub(s.id)}
                              className={`text-left text-xs px-2.5 py-2 rounded-lg border transition ${
                                sel ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/40'
                              }`}>
                              {sel && '✓ '}{nameOf(s)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 2 - Location */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Viloyat</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                  {uzbekRegions.map(r => (
                    <button key={r} type="button" onClick={() => setForm({ ...form, region: r })}
                      className={`p-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium transition ${
                        form.region === r ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      }`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Tuman / Shahar</Label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10 h-11 rounded-xl" placeholder="Chilonzor"
                    value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Xizmat ko'rsatish radiusi: <span className="text-primary font-bold">{form.radiusKm} km</span></Label>
                <input type="range" min={1} max={100} value={form.radiusKm}
                  onChange={e => setForm({ ...form, radiusKm: +e.target.value })}
                  className="w-full mt-2 accent-primary" />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                  <span>1 km</span><span>100 km</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Experience */}
          {step === 3 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">Umumiy tajribangiz</p>
              <div className="grid gap-2.5">
                {EXPERIENCE_OPTIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => setForm({ ...form, experienceYears: o.value })}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold flex items-center justify-between transition ${
                      form.experienceYears === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    }`}>
                    <span>{o.label}</span>
                    {form.experienceYears === o.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 - Schedule */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label>Ish kunlari</Label>
                <div className="grid grid-cols-7 gap-1.5 mt-1.5">
                  {WEEK_DAYS.map(d => (
                    <button key={d.v} type="button" onClick={() => toggleDay(d.v)}
                      className={`h-11 rounded-xl border-2 text-sm font-bold transition ${
                        form.workDays.includes(d.v) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      }`}>{d.l}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Boshlanish</Label>
                  <Input type="time" className="mt-1.5 h-11 rounded-xl" value={form.workStart}
                    onChange={e => setForm({ ...form, workStart: e.target.value })} />
                </div>
                <div>
                  <Label>Tugash</Label>
                  <Input type="time" className="mt-1.5 h-11 rounded-xl" value={form.workEnd}
                    onChange={e => setForm({ ...form, workEnd: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-border cursor-pointer hover:border-primary/40">
                <input type="checkbox" checked={form.acceptsEmergency}
                  onChange={e => setForm({ ...form, acceptsEmergency: e.target.checked })}
                  className="w-5 h-5 accent-primary" />
                <div>
                  <div className="text-sm font-semibold">🚨 Favqulodda chaqiruvlarni qabul qilaman</div>
                  <div className="text-xs text-muted-foreground">24/7 shoshilinch buyurtmalar keladi</div>
                </div>
              </label>
            </div>
          )}

          {/* Step 5 - Documents */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>Hujjatlar maxfiy saqlanadi. Faqat administrator verifikatsiya uchun ko'radi.</span>
              </div>
              <FileField label="Pasport / ID karta rasmi" file={idFile}
                onPick={f => pickFile(f, setIdFile)} />
              <FileField label="Selfie (ID bilan)" file={selfieFile}
                onPick={f => pickFile(f, setSelfieFile)} />
              <div>
                <Label>Sertifikat / malaka hujjati (ixtiyoriy, bir nechta)</Label>
                <label className="mt-1.5 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{certFiles.length > 0 ? `${certFiles.length} ta fayl tanlangan` : 'Fayllar tanlash'}</span>
                  <input type="file" accept="image/*,.pdf" multiple className="hidden"
                    onChange={e => setCertFiles(Array.from(e.target.files || []))} />
                </label>
              </div>
              <div>
                <Label>Portfolio — bajarilgan ishlar (3-5+ rasm)</Label>
                <label className="mt-1.5 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{portfolioFiles.length > 0 ? `${portfolioFiles.length} ta rasm` : 'Rasmlar tanlash'}</span>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={e => setPortfolioFiles(Array.from(e.target.files || []))} />
                </label>
                {portfolioFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {portfolioFiles.slice(0, 8).map((f, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-muted overflow-hidden">
                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6 - Payment */}
          {step === 6 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">To'lovlarni qabul qilish uchun karta/hisob ma'lumotlari (ixtiyoriy, keyinroq qo'shsa ham bo'ladi)</p>
              <div>
                <Label>Bank karta raqami</Label>
                <div className="relative mt-1.5">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10 h-11 rounded-xl" placeholder="8600 0000 0000 0000"
                    value={form.cardNumber} onChange={e => setForm({ ...form, cardNumber: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Bank hisob raqami (ixtiyoriy)</Label>
                <Input className="mt-1.5 h-11 rounded-xl" placeholder="2020 8000 ..."
                  value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
              </div>
              <div>
                <Label>STIR / soliq ma'lumoti (yuridik shaxs bo'lsa)</Label>
                <Input className="mt-1.5 h-11 rounded-xl" placeholder="STIR raqami"
                  value={form.taxInfo} onChange={e => setForm({ ...form, taxInfo: e.target.value })} />
              </div>
            </div>
          )}

          {/* Step 7 - Profile */}
          {step === 7 && (
            <div className="space-y-5">
              <div>
                <Label>Profil rasmi</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden flex items-center justify-center border-2 border-border">
                    {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <User className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && pickFile(e.target.files[0], setAvatarFile, setAvatarPreview)} />
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15">
                      <Upload className="h-4 w-4" /> Rasm tanlash
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <Label>O'zingiz haqingizda</Label>
                <Textarea className="mt-1.5 rounded-xl" rows={4}
                  placeholder="Ish uslubingiz, mijozlarga munosabatingiz haqida qisqacha..."
                  value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} />
              </div>
            </div>
          )}

          {/* Step 8 - Agreement */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/40 border text-sm space-y-2">
                <p className="font-semibold">Xulosa:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• {form.categoryIds.length} kategoriya, {form.subcategoryIds.length} xizmat</li>
                  <li>• {form.region}, {form.city} — {form.radiusKm} km radius</li>
                  <li>• Ish kunlari: {form.workDays.length} kun, {form.workStart}-{form.workEnd}</li>
                  <li>• Favqulodda: {form.acceptsEmergency ? 'ha' : 'yo\'q'}</li>
                  <li>• Hujjatlar: {[idFile, selfieFile].filter(Boolean).length}/2, portfolio: {portfolioFiles.length}</li>
                </ul>
              </div>
              <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-border cursor-pointer hover:border-primary/40">
                <input type="checkbox" checked={form.agreedToTerms}
                  onChange={e => setForm({ ...form, agreedToTerms: e.target.checked })}
                  className="w-5 h-5 mt-0.5 accent-primary" />
                <span className="text-sm">Men <a className="text-primary underline">Foydalanish shartlari</a>ga roziman</span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-border cursor-pointer hover:border-primary/40">
                <input type="checkbox" checked={form.agreedToPrivacy}
                  onChange={e => setForm({ ...form, agreedToPrivacy: e.target.checked })}
                  className="w-5 h-5 mt-0.5 accent-primary" />
                <span className="text-sm">Men <a className="text-primary underline">Maxfiylik siyosati</a>ga roziman</span>
              </label>
              <div className="text-xs bg-success/10 border border-success/30 rounded-xl p-3 text-success">
                🎉 30 kunlik PRO tarif sinov muddati avtomatik faollashadi!
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-5">
          <Button variant="outline" className="rounded-xl gap-1.5" onClick={back} disabled={step === 0 || loading}>
            <ChevronLeft className="h-4 w-4" /> Orqaga
          </Button>
          <Button className="rounded-xl btn-hero gap-1.5 flex-1 sm:flex-none sm:min-w-[180px]"
            onClick={next} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> :
              step === STEPS.length - 1 ? (<>Yakunlash <Check className="h-4 w-4" /></>) :
              (<>Davom etish <ChevronRight className="h-4 w-4" /></>)}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Hisobingiz bormi?{' '}
          <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">Kirish</button>
        </p>
      </div>
    </Layout>
  );
}

function FileField({ label, file, onPick }: { label: string; file: File | null; onPick: (f: File) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <label className="mt-1.5 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer">
        {file ? <Check className="h-4 w-4 text-success" /> : <Upload className="h-4 w-4" />}
        <span className="text-sm truncate">{file ? file.name : 'Fayl tanlash'}</span>
        <input type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && onPick(e.target.files[0])} />
      </label>
    </div>
  );
}
