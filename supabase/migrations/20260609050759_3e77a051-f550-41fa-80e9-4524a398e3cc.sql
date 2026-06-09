
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audience TEXT NOT NULL CHECK (audience IN ('master','client')),
  tier TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '⭐',
  badge TEXT DEFAULT '',
  popular BOOLEAN NOT NULL DEFAULT false,
  features TEXT[] NOT NULL DEFAULT '{}',
  price_1m NUMERIC NOT NULL DEFAULT 0,
  price_3m NUMERIC NOT NULL DEFAULT 0,
  price_6m NUMERIC NOT NULL DEFAULT 0,
  price_12m NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_num INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (audience, tier)
);

GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage plans insert"
  ON public.subscription_plans FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage plans update"
  ON public.subscription_plans FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage plans delete"
  ON public.subscription_plans FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default plans
INSERT INTO public.subscription_plans (audience, tier, name, icon, badge, popular, features, price_1m, price_3m, price_6m, price_12m, order_num) VALUES
  ('master','basic','BASIC','🟢','Yangi boshlovchilar',false,
    ARRAY['Profil yaratish','5 tagacha xizmat qo''shish','Buyurtmalarni qabul qilish','Mijoz bilan chat','Reyting va sharhlar','Portfolio (10 tagacha rasm)','Asosiy statistika'],
    19000,54000,99000,189000,1),
  ('master','pro','PRO','⭐','Faol ustalar',true,
    ARRAY['BASIC dagi hammasi','Cheksiz xizmatlar','Cheksiz portfolio','Qidiruvda yuqoriroq','Batafsil statistika','Tasdiqlangan usta belgisi','Telegram bildirishnomalari','Tezkor support'],
    39000,109000,209000,399000,2),
  ('master','premium','VIP','👑','Professional ustalar',false,
    ARRAY['PRO dagi hammasi','Eng yuqori prioritet','Premium badge','Tavsiya etilgan ustalar bo''limi','AI yordamchi','Reklama chegirmalari','Prioritet buyurtmalar','Shaxsiy menejer support'],
    59000,169000,319000,599000,3),
  ('client','free','FREE','🆓','Boshlovchilar uchun',false,
    ARRAY['Usta qidirish','Buyurtma yaratish','Chat','Sharh qoldirish','Sevimlilar ro''yxati','Buyurtma tarixi'],
    0,0,0,0,1),
  ('client','pro','PRO','⭐','Faol mijozlar',true,
    ARRAY['FREE dagi hammasi','Buyurtma ustalarga yuqoriroq','Prioritet chat','2% cashback','Maxsus aksiyalar','PRO badge','Tezkor support'],
    19000,54000,99000,189000,2),
  ('client','vip','VIP','👑','Premium mijozlar',false,
    ARRAY['PRO dagi hammasi','5% cashback','VIP badge','Premium support','Prioritet buyurtmalar','Maxsus chegirmalar','Yangi funksiyalarga erta kirish','AI tavsiyalar'],
    39000,109000,209000,399000,3)
ON CONFLICT (audience, tier) DO NOTHING;
