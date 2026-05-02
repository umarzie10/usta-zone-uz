import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Zap, Droplets, Wind, Sparkles, Sofa, Hammer, Palette, Cog,
  Thermometer, DoorOpen, Flame, Wifi, Camera, SprayCan, Waves,
  MapPin, ImagePlus, Loader2, AlertTriangle, ArrowRight, ArrowLeft,
  Brain, Square, Layers, LayoutGrid, RectangleHorizontal, CheckCircle2
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Droplets, Zap, Sparkles, Sofa, Hammer, Palette, Wind, Cog,
  Thermometer, DoorOpen, Square, Flame, Layers, LayoutGrid,
  RectangleHorizontal, Wifi, Camera, SprayCan, Waves,
};

interface CategoryItem {
  id: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  icon: string;
  color: string | null;
}

interface PriceEstimate {
  min: number;
  max: number;
  description: string;
}

export default function QuickOrder() {
  const { t, lang, showNotification } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  const getCatName = (cat: CategoryItem) => {
    if (lang === 'ru') return cat.name_ru;
    if (lang === 'en') return cat.name_en;
    return cat.name_uz;
  };

  useEffect(() => {
    supabase.from('categories').select('id, name_uz, name_ru, name_en, icon, color')
      .order('order_num').then(({ data }) => setCategories(data || []));
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const fetchEstimate = async () => {
    if (!description || description.length < 5) return;
    setEstimateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-estimate', {
        body: { description, category: selectedCategory ? getCatName(selectedCategory) : '' },
      });
      if (!error && data && !data.error) {
        setEstimate(data);
      }
    } catch {
      // silently fail
    } finally {
      setEstimateLoading(false);
    }
  };

  // Auto-fetch estimate when description changes (debounced)
  useEffect(() => {
    if (step === 2 && description.length >= 10) {
      const timer = setTimeout(fetchEstimate, 1500);
      return () => clearTimeout(timer);
    }
  }, [description, step]);

  const handleSubmit = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selectedCategory || !address) return;
    setLoading(true);

    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const path = `orders/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('portfolio').upload(path, photoFile);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }

      const amount = estimate ? Math.round((estimate.min + estimate.max) / 2) : 0;
      const commission = amount * 0.1;
      const masterAmount = amount - commission;

      const title = `${getCatName(selectedCategory)}${isEmergency ? ' 🚨' : ''}`;
      const fullDesc = `${description}${photoUrl ? `\n\n📷 Rasm: ${photoUrl}` : ''}`;

      const { data: orderData, error } = await supabase.from('orders').insert({
        client_id: user.id,
        title,
        description: fullDesc,
        category_id: selectedCategory.id,
        payment_method: 'cash',
        amount,
        commission_amount: commission,
        master_amount: masterAmount,
        city: 'Toshkent',
        address,
        status: isEmergency ? 'urgent' : 'pending',
      }).select('id').single();

      if (error) throw error;

      // Emergency: notify masters — prefer category match, fallback to ALL active masters
      if (isEmergency) {
        const { data: masters } = await supabase
          .from('master_profiles')
          .select('user_id, category_ids')
          .eq('is_active', true);

        if (masters && masters.length > 0) {
          // First try category match
          let targetMasters = masters.filter(m =>
            Array.isArray(m.category_ids) && m.category_ids.includes(selectedCategory.id)
          );
          // Fallback: notify ALL active masters if no category match
          if (targetMasters.length === 0) {
            targetMasters = masters;
          }
          // Dedupe by user_id and exclude the requester
          const seen = new Set<string>();
          const notifications = targetMasters
            .filter(m => m.user_id && m.user_id !== user.id && !seen.has(m.user_id) && seen.add(m.user_id))
            .map(m => ({
              user_id: m.user_id,
              sender_id: user.id,
              title: '🚨 Shoshilinch buyurtma!',
              message: `"${title}" — ${address}`,
              type: 'emergency_order',
              related_order_id: orderData?.id || null,
            }));
          if (notifications.length > 0) {
            const { error: notifErr } = await supabase.from('notifications').insert(notifications);
            if (notifErr) console.error('Emergency notify error:', notifErr);
          }
        }
      }

      showNotification('success', t('orderCreated'));
      navigate('/dashboard/client');
    } catch (err: any) {
      showNotification('error', err.message || t('paymentError'));
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = {
    uz: ['Xizmat tanlang', 'Muammoni tasvirlang', 'Manzilingiz'],
    ru: ['Выберите услугу', 'Опишите проблему', 'Ваш адрес'],
    en: ['Select service', 'Describe problem', 'Your address'],
  };

  const labels = stepLabels[lang] || stepLabels.uz;

  return (
    <section className="section-padding max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-3">
          <Zap className="h-4 w-4" />
          {lang === 'ru' ? 'Быстрый заказ за 20 секунд' : lang === 'en' ? 'Quick order in 20 seconds' : '20 soniyada tezkor buyurtma'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black">
          {lang === 'ru' ? '1-клик заказ' : lang === 'en' ? '1-Click Order' : '1-klik buyurtma'}
        </h2>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === s ? 'bg-primary text-primary-foreground scale-110' :
              step > s ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-primary' : 'text-muted-foreground'}`}>
              {labels[s - 1]}
            </span>
            {s < 3 && <div className={`w-8 sm:w-12 h-0.5 ${step > s ? 'bg-success' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <div className="card-premium p-5 sm:p-8">
        {/* Step 1: Category selection */}
        {step === 1 && (
          <div className="animate-fade-in">
            <p className="text-muted-foreground mb-5 text-center">
              {lang === 'ru' ? 'Какая услуга вам нужна?' : lang === 'en' ? 'What service do you need?' : 'Qanday xizmat kerak?'}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
              {categories.map(cat => {
                const Icon = iconMap[cat.icon] || Hammer;
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat); setStep(2); }}
                    className={`p-3 sm:p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2 transition-all hover-lift ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color || '#6366f1'}18` }}>
                      <Icon className="h-5 w-5" style={{ color: cat.color || '#6366f1' }} />
                    </div>
                    <p className="font-medium text-xs leading-tight">{getCatName(cat)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Description + Photo + AI estimate */}
        {step === 2 && (
          <div className="animate-fade-in space-y-5">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
              {(() => { const Icon = iconMap[selectedCategory?.icon || ''] || Hammer; return <Icon className="h-5 w-5 text-primary" />; })()}
              <span className="font-semibold text-sm">{selectedCategory ? getCatName(selectedCategory) : ''}</span>
              <button onClick={() => setStep(1)} className="ml-auto text-xs text-primary underline">
                {lang === 'ru' ? 'Изменить' : lang === 'en' ? 'Change' : "O'zgartirish"}
              </button>
            </div>

            <Textarea
              rows={3}
              className="rounded-xl resize-none"
              placeholder={lang === 'ru' ? 'напр. Кран течёт на кухне...' : lang === 'en' ? 'e.g. Kitchen faucet is leaking...' : "masalan: Oshxonada kran oqyapti..."}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            {/* AI Price Estimate */}
            {estimateLoading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/5 border border-accent/20 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-muted-foreground">
                  {lang === 'ru' ? 'AI оценивает стоимость...' : lang === 'en' ? 'AI estimating price...' : 'AI narxni taxmin qilmoqda...'}
                </span>
              </div>
            )}
            {estimate && !estimateLoading && (
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 animate-scale-in">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-accent" />
                  <span className="font-semibold text-sm">
                    {lang === 'ru' ? 'AI оценка стоимости' : lang === 'en' ? 'AI Price Estimate' : 'AI narx taxmini'}
                  </span>
                </div>
                <p className="text-2xl font-black text-accent">
                  {estimate.min.toLocaleString()} – {estimate.max.toLocaleString()} <span className="text-sm font-medium">so'm</span>
                </p>
                {estimate.description && (
                  <p className="text-xs text-muted-foreground mt-1">{estimate.description}</p>
                )}
              </div>
            )}

            {/* Photo upload */}
            <div>
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-all">
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">
                    {photoPreview
                      ? (lang === 'ru' ? 'Фото загружено ✓' : lang === 'en' ? 'Photo uploaded ✓' : 'Rasm yuklandi ✓')
                      : (lang === 'ru' ? 'Добавить фото (необязательно)' : lang === 'en' ? 'Add photo (optional)' : 'Rasm qo\'shing (ixtiyoriy)')
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'ru' ? 'Поможет мастеру оценить работу' : lang === 'en' ? 'Helps the master assess the job' : 'Ustaga ishni baholashda yordam beradi'}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>

            {/* Emergency toggle */}
            <button
              type="button"
              onClick={() => setIsEmergency(!isEmergency)}
              className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                isEmergency ? 'border-destructive bg-destructive/10' : 'border-border hover:border-destructive/40'
              }`}
            >
              <AlertTriangle className={`h-6 w-6 ${isEmergency ? 'text-destructive' : 'text-muted-foreground'}`} />
              <div>
                <p className={`font-semibold text-sm ${isEmergency ? 'text-destructive' : ''}`}>
                  🚨 {lang === 'ru' ? 'Срочный вызов' : lang === 'en' ? 'Emergency Call' : 'Shoshilinch chaqiruv'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ru' ? 'Все мастера получат уведомление' : lang === 'en' ? 'All masters will be notified' : 'Barcha ustalarga bildirishnoma ketadi'}
                </p>
              </div>
            </button>

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t('back')}
              </Button>
              <Button
                className="flex-1 rounded-xl btn-hero"
                disabled={!description}
                onClick={() => setStep(3)}
              >
                {lang === 'ru' ? 'Далее' : lang === 'en' ? 'Next' : 'Keyingi'} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Address + Submit */}
        {step === 3 && (
          <div className="animate-fade-in space-y-5">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
              {(() => { const Icon = iconMap[selectedCategory?.icon || ''] || Hammer; return <Icon className="h-4 w-4 text-primary" />; })()}
              <span className="font-medium">{selectedCategory ? getCatName(selectedCategory) : ''}</span>
              {isEmergency && <span className="ml-auto text-xs font-semibold text-destructive">🚨 {lang === 'ru' ? 'Срочно' : lang === 'en' ? 'Urgent' : 'Shoshilinch'}</span>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                <MapPin className="h-4 w-4 inline mr-1" />
                {lang === 'ru' ? 'Ваш адрес' : lang === 'en' ? 'Your address' : 'Manzilingiz'}
              </label>
              <Input
                className="rounded-xl h-12"
                placeholder={lang === 'ru' ? 'Улица, дом, квартира...' : lang === 'en' ? 'Street, building, apartment...' : "Ko'cha, uy, kvartira..."}
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-muted space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === 'ru' ? 'Услуга' : lang === 'en' ? 'Service' : 'Xizmat'}</span>
                <span className="font-medium">{selectedCategory ? getCatName(selectedCategory) : ''}</span>
              </div>
              {estimate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{lang === 'ru' ? 'Оценка' : lang === 'en' ? 'Estimate' : 'Taxmin'}</span>
                  <span className="font-medium text-accent">{estimate.min.toLocaleString()} – {estimate.max.toLocaleString()} so'm</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === 'ru' ? 'Оплата' : lang === 'en' ? 'Payment' : "To'lov"}</span>
                <span className="font-medium">{t('cash')}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t('back')}
              </Button>
              <Button
                className={`flex-1 rounded-xl h-12 text-base font-semibold ${isEmergency ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'btn-hero'}`}
                disabled={loading || !address}
                onClick={handleSubmit}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    {isEmergency ? '🚨 ' : ''}
                    {lang === 'ru' ? 'Отправить заказ' : lang === 'en' ? 'Submit Order' : 'Buyurtma berish'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
