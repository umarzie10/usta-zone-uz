
-- 1. Add hierarchy support to categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS slug text;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- 2. Extend master_profiles with all onboarding fields
ALTER TABLE public.master_profiles
  ADD COLUMN IF NOT EXISTS subcategory_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_radius_km int DEFAULT 20,
  ADD COLUMN IF NOT EXISTS work_days text[] DEFAULT ARRAY['mon','tue','wed','thu','fri','sat'],
  ADD COLUMN IF NOT EXISTS work_start time DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS work_end time DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS accepts_emergency boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_document_url text,
  ADD COLUMN IF NOT EXISTS selfie_url text,
  ADD COLUMN IF NOT EXISTS certificate_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS card_number text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS tax_info text,
  ADD COLUMN IF NOT EXISTS agreed_to_terms boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreed_to_privacy boolean DEFAULT false;

-- 3. Seed categories + subcategories (idempotent by (name_uz, parent_id))
DO $$
DECLARE
  cat_id uuid;
  cats jsonb := '[
    {"n":"Elektr","icon":"zap","color":"#f59e0b","subs":["Rozetka o''rnatish","Chiroq o''rnatish","Elektr simlarini tortish","Avtomat (shchit) o''rnatish","Qisqa tutashuvni bartaraf etish","Generator ulash"]},
    {"n":"Santexnika","icon":"droplet","color":"#3b82f6","subs":["Kran ta''mirlash","Unitaz o''rnatish","Rakovina o''rnatish","Dush kabinasi o''rnatish","Quvur almashtirish","Oqishni bartaraf etish","Suv isitgich (boiler) o''rnatish"]},
    {"n":"Konditsioner","icon":"wind","color":"#06b6d4","subs":["O''rnatish","Demontaj","Gaz to''ldirish","Tozalash (servis)","Ta''mirlash"]},
    {"n":"Isitish tizimi","icon":"flame","color":"#ef4444","subs":["Qozon (kotel) o''rnatish","Radiator o''rnatish","Issiq pol","Nasos o''rnatish","Ta''mirlash"]},
    {"n":"Qurilish","icon":"hammer","color":"#78716c","subs":["G''isht terish","Beton ishlari","Fundament","Devor qurish","Tom yopish"]},
    {"n":"Bo''yash va pardoz","icon":"paintbrush","color":"#a855f7","subs":["Devor bo''yash","Shift bo''yash","Shpaklyovka","Dekorativ bo''yoq"]},
    {"n":"Mebel","icon":"armchair","color":"#92400e","subs":["Mebel yig''ish","Mebel ta''mirlash","Oshxona mebeli o''rnatish","Shkaf yig''ish"]},
    {"n":"Eshik va deraza","icon":"door-open","color":"#0891b2","subs":["Eshik o''rnatish","Qulf almashtirish","Plastik deraza o''rnatish","Deraza ta''mirlash"]},
    {"n":"Kafel va pol","icon":"grid-3x3","color":"#64748b","subs":["Kafel terish","Laminat yotqizish","Parket","Linoleum","Polni tekislash"]},
    {"n":"Tozalash","icon":"sparkles","color":"#10b981","subs":["Kvartira tozalash","Ofis tozalash","Ta''mirdan keyingi tozalash","Gilam yuvish","Divan yuvish"]},
    {"n":"Maishiy texnika","icon":"tv","color":"#6366f1","subs":["Kir yuvish mashinasi ta''miri","Muzlatgich ta''miri","Idish yuvish mashinasi","Duxovka","Gaz plita"]},
    {"n":"Internet va TV","icon":"wifi","color":"#0ea5e9","subs":["Wi-Fi router o''rnatish","Internet kabel tortish","TV o''rnatish","Kamera (CCTV) o''rnatish"]},
    {"n":"Xavfsizlik","icon":"shield","color":"#dc2626","subs":["Videokuzatuv","Signalizatsiya","Domofon","Smart qulf"]},
    {"n":"Bog'' va hovli","icon":"trees","color":"#16a34a","subs":["Maysa o''rish","Daraxt kesish","Sug''orish tizimi","Hovli tozalash"]},
    {"n":"Ko''chirish xizmati","icon":"truck","color":"#eab308","subs":["Yuk tashish","Mebel ko''chirish","Yuk ortish/tushirish"]},
    {"n":"Avto xizmat","icon":"car","color":"#4b5563","subs":["Akkumulyator almashtirish","Shina almashtirish","Evakuator","Joyiga borib ta''mirlash"]},
    {"n":"Oyna ishlari","icon":"square","color":"#7c3aed","subs":["Oyna almashtirish","Oyna o''rnatish","Balkon oynalari"]},
    {"n":"Usta chaqirish","icon":"wrench","color":"#1a56db","subs":["Mayda ta''mirlash","Handyman (bir nechta ish)"]}
  ]'::jsonb;
  item jsonb; sub text; ord int := 0;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(cats) LOOP
    ord := ord + 1;
    SELECT id INTO cat_id FROM public.categories
      WHERE name_uz = (item->>'n') AND parent_id IS NULL LIMIT 1;
    IF cat_id IS NULL THEN
      INSERT INTO public.categories(name_uz, name_ru, name_en, icon, color, order_num)
        VALUES (item->>'n', item->>'n', item->>'n', item->>'icon', item->>'color', ord)
        RETURNING id INTO cat_id;
    ELSE
      UPDATE public.categories SET icon = item->>'icon', color = item->>'color', order_num = ord
        WHERE id = cat_id;
    END IF;

    FOR sub IN SELECT jsonb_array_elements_text(item->'subs') LOOP
      INSERT INTO public.categories(name_uz, name_ru, name_en, icon, color, parent_id, order_num)
      SELECT sub, sub, sub, item->>'icon', item->>'color', cat_id, 0
      WHERE NOT EXISTS (
        SELECT 1 FROM public.categories WHERE name_uz = sub AND parent_id = cat_id
      );
    END LOOP;
  END LOOP;
END $$;
