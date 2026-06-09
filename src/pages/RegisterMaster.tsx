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
  ChevronLeft, ChevronRight, Briefcase, MapPin, Award, Image as ImageIcon, Upload
} from 'lucide-react';
import { uzbekRegions } from '@/lib/demoData';

interface Category {
  id: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
}

const EXPERIENCE_OPTIONS = [
  { value: 1, label: '0-1 yil' },
  { value: 2, label: '1-3 yil' },
  { value: 4, label: '3-5 yil' },
  { value: 7, label: '5-10 yil' },
  { value: 12, label: '10+ yil' },
];

const STEPS = [
  { key: 'account', title: 'Hisob', icon: User },
  { key: 'categories', title: 'Xizmatlar', icon: Briefcase },
  { key: 'location', title: 'Joylashuv', icon: MapPin },
  { key: 'experience', title: 'Tajriba', icon: Award },
  { key: 'profile', title: 'Profil', icon: ImageIcon },
] as const;

export default function RegisterMaster() {
  const { signUp, signIn, user } = useAuth();
  const { lang, showNotification } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', password: '',
    categoryIds: [] as string[],
    region: 'Toshkent shahri', city: 'Toshkent',
    experienceYears: 2,
    about: '',
  });

  useEffect(() => {
    supabase.from('categories').select('id, name_uz, name_ru, name_en').order('order_num').then(({ data }) => {
      setCategories((data as Category[]) || []);
    });
  }, []);

  const getCategoryName = (cat: Category) =>
    lang === 'ru' ? cat.name_ru : lang === 'en' ? cat.name_en : cat.name_uz;

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const toggleCategory = (id: string) => {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter(c => c !== id)
        : [...f.categoryIds, id],
    }));
  };

  const onAvatarPick = (file: File) => {
    setAvatarFile(file);
    const r = new FileReader();
    r.onload = e => setAvatarPreview(e.target?.result as string);
    r.readAsDataURL(file);
  };

  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        if (!form.fullName.trim()) return 'Ism va familiyani kiriting';
        if (!form.phone.trim() || form.phone.length < 9) return 'Telefon raqamni to\'g\'ri kiriting';
        if (!form.email.trim() || !form.email.includes('@')) return 'Email manzilni to\'g\'ri kiriting';
        if (form.password.length < 6) return 'Parol kamida 6 belgi bo\'lishi kerak';
        return null;
      case 1:
        if (form.categoryIds.length === 0) return 'Kamida bitta xizmatni tanlang';
        return null;
      case 2:
        if (!form.region) return 'Viloyatni tanlang';
        if (!form.city.trim()) return 'Tuman / shahar nomini kiriting';
        return null;
      case 3:
        return null;
      case 4:
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

  const submit = async () => {
    const err = validateStep();
    if (err) return showNotification('error', err);
    setLoading(true);
    try {
      // 1. Create auth user
      await signUp(form.email, form.password, {
        full_name: form.fullName,
        phone: form.phone,
        city: form.city,
        region: form.region,
        role: 'master',
      });

      // 2. Sign in
      await signIn(form.email, form.password).catch(() => {});
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (!newUser) throw new Error('Foydalanuvchi yaratilmadi');

      // 3. Upload avatar (if any)
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${newUser.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = publicUrl;
          await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', newUser.id);
        }
      }

      // 4. Create master profile
      await supabase.from('master_profiles').insert({
        user_id: newUser.id,
        category_ids: form.categoryIds,
        experience_years: form.experienceYears,
        skills: [],
        bio: form.about || null,
        is_active: true,
      });

      showNotification('success', 'Ro\'yxatdan o\'tish muvaffaqiyatli! Profilingizni davom ettiring.');
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
          <div className="flex items-center justify-between mb-3 overflow-x-auto pb-2">
            {STEPS.map((s, i) => {
              const SIcon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={s.key} className="flex items-center shrink-0">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      isDone ? 'bg-success text-success-foreground' :
                      isActive ? 'bg-primary text-primary-foreground scale-110 shadow-lg' :
                      'bg-muted text-muted-foreground'
                    }`}>
                    {isDone ? <Check className="h-4 w-4" /> : <SIcon className="h-4 w-4" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-6 sm:w-12 h-0.5 mx-1 ${isDone ? 'bg-success' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {step + 1}-bosqich: {STEPS[step].title}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step content */}
        <div className="card-premium p-5 sm:p-7 reveal">
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

          {step === 1 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Qaysi xizmatlarni bajarasiz? Bir nechta tanlash mumkin.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categories.map(cat => {
                  const selected = form.categoryIds.includes(cat.id);
                  return (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                      className={`relative p-3 rounded-xl border-2 text-sm font-medium text-left transition ${
                        selected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      }`}>
                      {selected && <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-primary" />}
                      {getCategoryName(cat)}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Tanlangan: {form.categoryIds.length}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Viloyat</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                  {uzbekRegions.map(r => (
                    <button key={r} type="button" onClick={() => setForm({ ...form, region: r })}
                      className={`p-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium transition ${
                        form.region === r ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      }`}>
                      {r}
                    </button>
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
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                📍 {form.region}, {form.city}
              </p>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">Tajribangizni tanlang</p>
              <div className="grid grid-cols-1 gap-2.5">
                {EXPERIENCE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm({ ...form, experienceYears: opt.value })}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold text-left transition flex items-center justify-between ${
                      form.experienceYears === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    }`}>
                    <span>{opt.label}</span>
                    {form.experienceYears === opt.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <Label>Profil rasmi</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden flex items-center justify-center border-2 border-border">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                      : <User className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && onAvatarPick(e.target.files[0])} />
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition">
                      <Upload className="h-4 w-4" /> Rasm tanlash
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <Label>O'zingiz haqingizda</Label>
                <Textarea className="mt-1.5 rounded-xl" rows={4}
                  placeholder="Tajribangiz, ish uslubingiz haqida qisqacha..."
                  value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} />
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
                💡 Ro'yxatdan o'tgandan keyin kabinetingizdan pasport, ish namunalari, narxlar, hamyon va verifikatsiyani qo'shishingiz mumkin.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
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
          <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">
            Tizimga kirish
          </button>
        </p>
      </div>
    </Layout>
  );
}
