# Texnik topshiriq — Backend (UstaZone)

**Platforma:** Supabase (Postgres + Auth + Storage + Edge Functions).

Barcha yangi jadval **majburiy tartibda**: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → `CREATE POLICY`. GRANT bo'lmasa PostgREST 401 qaytaradi.

---

## 1. `categories` jadvali

### Sxema
```sql
categories (
  id uuid PK default gen_random_uuid(),
  name_uz text NOT NULL,
  name_ru text,
  name_en text,
  icon text,           -- lucide slug: 'zap', 'droplet', ...
  color text,          -- '#rrggbb'
  order_num int default 0,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  slug text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
-- indeks:
CREATE INDEX idx_categories_parent ON categories(parent_id);
```
`parent_id IS NULL` → asosiy kategoriya; aks holda subkategoriya.

### GRANT'lar (mavjud, qayta yozmang)
```sql
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
```

### RLS siyosati
- **SELECT:** hamma uchun ochiq (`USING (true)`).
- **INSERT/UPDATE/DELETE:** faqat `has_role(auth.uid(), 'admin')`.

`has_role` — `SECURITY DEFINER` funksiya, `user_roles` jadvalidan tekshiradi. Rolni **hech qachon** profiles jadvaliga qo'ymaymiz.

---

## 2. `master_profiles` kengaytmasi

Onboarding uchun qo'shilgan ustunlar (barchasi mavjud):
- `subcategory_ids uuid[]` — tanlangan subkategoriyalar.
- `service_radius_km int default 20`.
- `work_days text[]` (`'mon'..'sun'`), `work_start time`, `work_end time`, `accepts_emergency bool`.
- `id_document_url text`, `selfie_url text`, `certificate_urls text[]`.
- `card_number`, `bank_account`, `tax_info` — **sensitiv**, `anon/authenticated` uchun SELECT taqiqlangan; faqat egasi RPC `get_my_master_profile` orqali oladi, admin `admin_get_master_profile` orqali.
- `agreed_to_terms`, `agreed_to_privacy`.

### Subkategoriya narxlari
`services` jadvali (mavjud) — har bir yozuv: `master_id`, `subcategory_id` (kategoriya jadvaliga FK), `price_type` (`fixed`/`from`/`hourly`), `price`, `is_negotiable`, `experience_years`, `portfolio_urls text[]`.

RLS: master faqat o'zi CRUD; hamma SELECT (aktiv usta profillari uchun).

---

## 3. Verifikatsiya oqimi

`verification_requests` jadvalidan foydalanamiz:
- Master hujjat va selfi yuklaydi → `status = 'pending'`.
- Admin `AdminVerificationPanel` orqali `approved` / `rejected` qiladi.
- `approved` bo'lsa `master_profiles.is_verified = true`, "Verified Usta" belgisi ko'rinadi.
- Rad etishda `admin_notes` majburiy.

RPC yoki admin siyosati orqali status o'zgartiriladi. Log/audit uchun `updated_at` trigger.

---

## 4. Sensitiv ma'lumot uchun RPClar (mavjud)

- `get_my_master_profile()` — foydalanuvchi o'z profilining barcha ustunlari.
- `get_my_profile()` — foydalanuvchi o'z profil (phone bilan).
- `admin_get_master_profile(uid)` / `admin_list_profiles()` / `admin_get_profiles(uid[])` — faqat `has_role('admin')` bo'lganda ishlaydi (`SECURITY DEFINER`, ichida rol tekshiruvi).

Yangi jadvalga sensitiv ustun qo'shsangiz, `REVOKE SELECT (col) ON tbl FROM anon, authenticated` qiling va admin/owner RPC yozing.

---

## 5. Yangi jadval qo'shish shabloni
```sql
CREATE TABLE public.example (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ...,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.example TO authenticated;
GRANT ALL ON public.example TO service_role;

ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON public.example
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_example_updated
  BEFORE UPDATE ON public.example
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 6. Edge Functions (mavjud)
- `ai-estimate` — Lovable AI Gateway orqali muammo tavsifini tahlil qilib narx oralig'ini qaytaradi.
- `ai-match` — mos usta tanlash.
- `send-sms` — Eskiz.uz API (secret: `ESKIZ_EMAIL`, `ESKIZ_PASSWORD`).
- `process-payment` — Click/Payme.

Har bir edge function `service_role` bilan ishlaydi va o'z ichida `auth.uid()` yoki JWT tekshiradi.

---

## 7. Definition of Done
- Admin `categories` ga CRUD qila oladi (GRANT+RLS to'g'ri).
- Master onboarding barcha maydonlari saqlanadi va kabinetda tahrirlash mumkin.
- Sensitiv maydonlar faqat egasi va adminga ochiq — anon/authenticated to'g'ridan-to'g'ri SELECT qila olmaydi.
- Verifikatsiya statusi kuzatiladi va "Verified Usta" bayrog'iga bog'lanadi.
- Har bir yangi `public` jadval GRANT + RLS + `updated_at` trigger bilan yaratiladi.
