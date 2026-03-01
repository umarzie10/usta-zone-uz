import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Briefcase, Clock } from 'lucide-react';

type Mode = 'login' | 'register';
type Role = 'client' | 'master';

interface Category {
  id: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
}

export default function LoginPage() {
  const { t, lang, showNotification } = useApp();
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('client');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    city: 'Toshkent',
    region: 'Toshkent shahri',
    categoryId: '',
    experienceYears: '',
  });

  useEffect(() => {
    if (mode === 'register' && role === 'master' && categories.length === 0) {
      supabase.from('categories').select('id, name_uz, name_ru, name_en').order('order_num').then(({ data }) => {
        setCategories(data || []);
      });
    }
  }, [mode, role]);

  const getCategoryName = (cat: Category) => {
    if (lang === 'ru') return cat.name_ru;
    if (lang === 'en') return cat.name_en;
    return cat.name_uz;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && role === 'master') {
      if (!form.categoryId) {
        showNotification('error', t('selectCategory'));
        return;
      }
      if (!form.experienceYears || parseInt(form.experienceYears) < 0) {
        showNotification('error', t('experienceRequired'));
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
        showNotification('success', t('successLogin'));
        navigate('/');
      } else {
        await signUp(form.email, form.password, {
          full_name: form.fullName,
          phone: form.phone,
          city: form.city,
          region: form.region,
          role: role,
        });

        // If master, create master_profiles entry
        if (role === 'master') {
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser) {
            await supabase.from('master_profiles').insert({
              user_id: newUser.id,
              category_ids: [form.categoryId],
              experience_years: parseInt(form.experienceYears) || 0,
              skills: [],
              is_active: true,
            });
          }
        }

        showNotification('success', t('successLogin'));
        navigate('/');
      }
    } catch (err: any) {
      showNotification('error', err.message || t('errorLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout noFooter>
      <div className="min-h-[calc(100vh-4rem)] flex">
        {/* Left side */}
        <div className="hidden lg:flex lg:w-1/2 hero-bg relative overflow-hidden items-center justify-center p-12">
          <div className="relative z-10 text-white text-center">
            <div className="text-7xl mb-6">🏗️</div>
            <h2 className="text-4xl font-black mb-4">UstaZone</h2>
            <p className="text-white/80 text-lg max-w-sm">{t('platformDesc')}</p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { n: '10K+', l: t('masters') },
                { n: '50K+', l: t('orders') },
                { n: '4.8★', l: t('rating') },
              ].map(s => (
                <div key={s.l} className="glass rounded-xl p-4">
                  <p className="text-2xl font-black">{s.n}</p>
                  <p className="text-white/70 text-xs mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Right side - form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-black mb-2">
                {mode === 'login' ? t('login') : t('register')}
              </h1>
              <p className="text-muted-foreground">
                {mode === 'login' ? t('noAccount') : t('alreadyHave')}{' '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-primary font-semibold hover:underline"
                >
                  {mode === 'login' ? t('registerHere') : t('loginHere')}
                </button>
              </p>
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(['client', 'master'] as Role[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-4 rounded-xl border-2 transition-all text-center font-medium ${
                      role === r
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="block text-2xl mb-1">{r === 'client' ? '👤' : '🔧'}</span>
                    {r === 'client' ? t('asClient') : t('asMaster')}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium">{t('fullName')}</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="fullName" placeholder="Jasur Toshmatov" className="pl-10 rounded-xl h-11"
                        value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">{t('phone')}</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" placeholder="+998 90 000 00 00" className="pl-10 rounded-xl h-11"
                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                  </div>

                  {/* Master-specific fields */}
                  {role === 'master' && (
                    <>
                      <div>
                        <Label htmlFor="category" className="text-sm font-medium">{t('categoryLabel')}</Label>
                        <div className="relative mt-1.5">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <select
                            id="category"
                            value={form.categoryId}
                            onChange={e => setForm({ ...form, categoryId: e.target.value })}
                            className="w-full pl-10 pr-4 h-11 rounded-xl border border-input bg-background text-sm font-medium appearance-none"
                            required
                          >
                            <option value="">{t('selectCategory')}</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{getCategoryName(cat)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="experience" className="text-sm font-medium">{t('experienceLabel')}</Label>
                        <div className="relative mt-1.5">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="experience"
                            type="number"
                            min="0"
                            max="50"
                            placeholder="3"
                            className="pl-10 rounded-xl h-11"
                            value={form.experienceYears}
                            onChange={e => setForm({ ...form, experienceYears: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div>
                <Label htmlFor="email" className="text-sm font-medium">{t('emailLabel')}</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="jasur@example.com" className="pl-10 rounded-xl h-11"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">{t('passwordLabel')}</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                    className="pl-10 pr-10 rounded-xl h-11"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl btn-hero text-base font-semibold mt-2" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (mode === 'login' ? t('login') : t('register'))}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
