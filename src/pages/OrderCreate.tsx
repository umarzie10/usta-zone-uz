import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { demoMasters, demoCategories, uzbekCities } from '@/lib/demoData';
import { ArrowLeft, MapPin, Banknote, CreditCard, Loader2 } from 'lucide-react';

export default function OrderCreatePage() {
  const { t, lang, showNotification } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const masterId = searchParams.get('master') || '';

  const preselectedMaster = demoMasters.find(m => m.id === masterId);

  const getCatName = (cat: typeof demoCategories[0]) => {
    if (lang === 'ru') return cat.nameRu;
    if (lang === 'en') return cat.nameEn;
    return cat.nameUz;
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    masterId: masterId,
    paymentMethod: 'cash',
    amount: '',
    city: 'Toshkent',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      const amount = parseFloat(form.amount) || 0;
      const commission = amount * 0.1;
      const masterAmount = amount - commission;

      const { error } = await supabase.from('orders').insert({
        client_id: user.id,
        title: form.title,
        description: form.description,
        payment_method: form.paymentMethod,
        amount,
        commission_amount: commission,
        master_amount: masterAmount,
        city: form.city,
        address: form.address,
        status: 'pending',
      });

      if (error) throw error;
      showNotification('success', t('orderCreated'));
      navigate('/dashboard/client');
    } catch (err: any) {
      showNotification('error', err.message || t('paymentError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-6 rounded-xl gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Button>

        <div className="card-premium p-6 sm:p-8">
          <h1 className="text-2xl font-black mb-1">{t('createOrder')}</h1>
          <p className="text-muted-foreground mb-8">{t('fillOrderDetails')}</p>

          {preselectedMaster && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
              <img src={preselectedMaster.avatar} alt={preselectedMaster.name}
                className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <p className="font-semibold">{preselectedMaster.name}</p>
                <p className="text-sm text-primary">{preselectedMaster.category}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm font-medium">{t('orderTitle')}</Label>
              <Input
                className="mt-1.5 rounded-xl h-11"
                placeholder={lang === 'en' ? "e.g. Replace kitchen faucet" : lang === 'ru' ? "напр. Замена кухонного крана" : "Masalan: Oshxona jo'mragini almashtirish"}
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium">{t('categoryLabel')}</Label>
              <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                <SelectTrigger className="mt-1.5 rounded-xl h-11">
                  <SelectValue placeholder={t('selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {demoCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{getCatName(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">{t('orderDescription')}</Label>
              <Textarea
                className="mt-1.5 rounded-xl resize-none"
                rows={4}
                placeholder={t('orderDescPlaceholder')}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">{t('city')}</Label>
                <Select value={form.city} onValueChange={v => setForm({ ...form, city: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uzbekCities.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">{t('orderAmount')} (so'm)</Label>
                <Input
                  type="number"
                  className="mt-1.5 rounded-xl h-11"
                  placeholder="150000"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">{t('orderAddress')}</Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 rounded-xl h-11"
                  placeholder={t('addressPlaceholder')}
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>

            {/* Payment method */}
            <div>
              <Label className="text-sm font-medium">{t('paymentMethod')}</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { id: 'cash', label: t('cash'), icon: Banknote, desc: t('cashDesc') },
                  { id: 'online', label: t('online'), icon: CreditCard, desc: t('onlineDesc') },
                ].map(pm => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: pm.id })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.paymentMethod === pm.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <pm.icon className={`h-5 w-5 mb-2 ${form.paymentMethod === pm.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-semibold text-sm">{pm.label}</p>
                    <p className="text-xs text-muted-foreground">{pm.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Commission info */}
            {form.amount && (
              <div className="p-4 rounded-xl bg-muted text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('totalAmount')}</span>
                  <span className="font-medium">{parseFloat(form.amount || '0').toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>{t('platformCommission')}</span>
                  <span>-{(parseFloat(form.amount || '0') * 0.1).toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between font-semibold text-success border-t border-border pt-1.5 mt-1.5">
                  <span>{t('masterReceives')}</span>
                  <span>{(parseFloat(form.amount || '0') * 0.9).toLocaleString()} so'm</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl btn-hero text-base font-semibold"
              disabled={loading || !form.title}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('submitOrder')}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
