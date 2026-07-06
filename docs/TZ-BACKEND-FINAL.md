# Texnik Topshiriq — Backend (UstaZone)

**Versiya:** Final &nbsp;|&nbsp; **Sana:** 2026-07-06 &nbsp;|&nbsp; **Auditoriya:** Backend jamoasi
**Platforma:** Lovable Cloud (Supabase: Postgres 15 + Auth + Storage + Edge Functions + Realtime)

Ushbu hujjat backend dasturchi uchun **yagona manba**. Ichida: sxema, GRANT'lar, RLS siyosati, RPC kontraktlari, Edge Function'lar, xavfsizlik va DoD.

---

## 0. Umumiy qoidalar (majburiy)

1. Har bir `public.<jadval>` yaratishda **qat'iy tartib**:
   ```
   CREATE TABLE  →  GRANT  →  ENABLE RLS  →  CREATE POLICY
   ```
   GRANT bo'lmasa PostgREST `permission denied` qaytaradi. RLS yolg'iz kifoya emas.

2. **GRANT shabloni** (user-facing jadval uchun):
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO authenticated;
   GRANT ALL ON public.<t> TO service_role;
   -- faqat public read kerak bo'lsa:
   GRANT SELECT ON public.<t> TO anon;
   ```

3. Har bir jadvalda `created_at timestamptz default now()` va `updated_at timestamptz default now()` + trigger `update_updated_at_column()`.

4. **Rollarni faqat `user_roles`** jadvalida saqlash. `profiles.role` faqat display uchun; ruxsatlar tekshiruvi `has_role(auth.uid(), 'admin')` orqali.

5. **Sensitiv ustunlar** (`phone`, `card_number`, `bank_account`, `tax_info`, `id_document_url`, `selfie_url`, `certificate_urls`):
   - `REVOKE SELECT (col) ON <t> FROM anon, authenticated;`
   - Egasi uchun: `get_my_*()` RPC (`SECURITY DEFINER`).
   - Admin uchun: `admin_get_*()` RPC (ichida `has_role` tekshiruvi).

6. **Tegilmaydi:** `auth`, `storage`, `realtime`, `supabase_functions`, `vault` sxemalari; `src/integrations/supabase/client.ts` va `types.ts` (auto-gen).

7. **`ALTER DATABASE postgres ...` taqiqlangan** — migration'da qabul qilinmaydi.

8. **CHECK constraint** faqat immutable ifodalar uchun. `now()`, `current_user` va h.k. — trigger orqali validatsiya.

---

## 1. Rollar va autentifikatsiya

### 1.1 `app_role` enum
```sql
CREATE TYPE public.app_role AS ENUM ('client', 'master', 'admin');
```

### 1.2 `user_roles`
```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self read" ON public.user_roles FOR SELECT
  TO authenticated USING (user_id = auth.uid());
```

### 1.3 `has_role` (rekursiv RLS'ni oldini oladi)
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
```
Har bir admin siyosatida shu funksiya chaqiriladi: `USING (public.has_role(auth.uid(),'admin'))`.

### 1.4 `handle_new_user` trigger
- `auth.users` INSERT → `profiles` + `user_roles` + boshlang'ich `subscriptions` (master 30 kun / client 7 kun trial `pro`).

---

## 2. Asosiy jadvallar (kontrakt)

### 2.1 `profiles`
- `user_id uuid UNIQUE REFERENCES auth.users`, `full_name`, `phone` (**sensitiv**), `city`, `region`, `role app_role`, `avatar_url`, `is_verified bool`, `is_blocked bool`, `bonus_balance numeric default 0`, `latitude/longitude`.
- RLS: SELECT — hamma (public katalog uchun) **lekin** `REVOKE SELECT (phone) FROM anon, authenticated`. UPDATE — egasi.
- Egasi to'liq profilni `get_my_profile()` RPC orqali oladi.

### 2.2 `categories` (2 darajali daraxt)
```sql
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uz text NOT NULL,
  name_ru text, name_en text,
  icon text, color text,
  order_num int DEFAULT 0,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admin write" ON public.categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
```
- Tartiblash: frontend 2 ta `UPDATE ... SET order_num = ?` yuboradi. Ommaviy tartib kerak bo'lsa `admin_reorder_categories(_ids uuid[])` RPC yozing (hozircha kerak emas).

### 2.3 `master_profiles`
- `user_id UNIQUE`, `bio`, `experience_years`, `rating numeric`, `jobs_completed int`, `is_verified`, `verification_tier`, `balance`, `withdrawable_balance`.
- Kategoriyalar: `category_ids uuid[]` (asosiy + subkategoriya id'lari birga saqlanadi).
- Onboarding: `service_radius_km int default 20`, `work_days text[]`, `work_start time`, `work_end time`, `accepts_emergency bool`.
- **Sensitiv**: `id_document_url`, `selfie_url`, `certificate_urls text[]`, `card_number`, `bank_account`, `tax_info` — `REVOKE SELECT (col) FROM anon, authenticated`.
- Indeks: `CREATE INDEX idx_master_profiles_category_ids ON public.master_profiles USING GIN (category_ids);`
- RLS: SELECT — hamma (public profil uchun, sensitiv kolonkalar REVOKE bilan yopilgan); UPDATE — egasi; admin ALL.

### 2.4 `services` (subkategoriya narxi)
- `master_id → master_profiles.id`, `subcategory_id → categories.id`, `price_type text CHECK (price_type IN ('fixed','from','hourly'))`, `price numeric`, `is_negotiable bool`, `experience_years int`, `portfolio_urls text[]`.
- RLS: SELECT hamma; INSERT/UPDATE/DELETE faqat egasi (`master_id` orqali `master_profiles.user_id = auth.uid()`).
- Limit trigger: `master_can_add_service(user_id)` — free tier 3 tagacha.

### 2.5 `verification_requests`
- `master_id`, `requested_tier verification_tier`, `documents jsonb`, `status text ('pending'|'approved'|'rejected')`, `admin_note`, `reviewed_by`, `reviewed_at`.
- RLS: usta o'z arizasini o'qiy oladi va yaratadi; admin ALL.
- Boshqarish: `admin_approve_verification(_request_id, _approve bool, _note text)` RPC.

### 2.6 Qolgan biznes jadvallar
`orders`, `reviews`, `messages`, `notifications`, `favorite_masters`, `saved_addresses`, `complaints`, `promo_codes`, `promo_redemptions`, `subscriptions`, `subscription_plans`, `transactions`, `withdraw_requests`, `master_availability`, `platform_settings`, `broadcasts` — barchasi mavjud. Yangi ustun qo'shishda § 0 qoidalarini takrorlang.

---

## 3. RPC kontraktlari

| RPC | Kirish | Chiqish | Kim chaqiradi |
|---|---|---|---|
| `has_role(uid, role)` | uuid, app_role | boolean | Ichki |
| `get_my_profile()` | — | `profiles` row | Har qanday auth |
| `get_my_master_profile()` | — | `master_profiles` row | Master |
| `get_my_subscription_status()` | — | jsonb `{tier,is_trial,expires_at,days_left,active,expired}` | Auth |
| `get_my_master_balance()` | — | `(balance,withdrawable_balance)` | Master |
| `admin_list_profiles()` | — | setof profiles | Admin |
| `admin_get_profiles(uid[])` | uuid[] | setof profiles | Admin |
| `admin_get_master_profile(uid)` | uuid | setof master_profiles | Admin |
| `admin_get_master_balances()` | — | setof(user_id,balance,withdrawable) | Admin |
| `admin_send_broadcast(audience,title,message,send_sms)` | — | jsonb `{ok,count,broadcast_id}` | Admin |
| `admin_approve_verification(id,approve,note)` | — | jsonb `{ok}` | Admin |
| `admin_delete_user(uid)` | uuid | void | Admin |
| `admin_recent_messages(limit)` | int | setof | Admin |
| `apply_promo_code(code,amount)` | — | jsonb `{ok,discount,final_amount,...}` | Auth |
| `redeem_promo_code(pc_id,order_id,discount)` | — | void | Auth |
| `activate_subscription(tier,months)` | — | jsonb `{ok,tier,expires_at}` | Auth |
| `use_bonus_balance(amount)` | numeric | jsonb `{ok,new_balance}` | Auth |
| `claim_emergency_order(order_id)` | uuid | jsonb `{ok,order_id,master_id}` | Master |
| `award_cashback(order_id)` | uuid | void | Trigger |
| `master_can_add_service(uid)` | uuid | boolean | Ichki |
| `master_can_accept_orders(uid)` | uuid | boolean | Ichki |
| `master_match_score(master_id, lat, lng)` | — | numeric | AI |
| `get_commission_percent()` | — | numeric | Ichki |

**Barcha admin RPC ichida birinchi qator:**
```sql
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
```

---

## 4. Edge Functions

Barchasi `service_role` bilan ishlaydi; ichida JWT/`auth.uid()` tekshiradi.

| Funksiya | Vazifasi | `verify_jwt` | Secrets |
|---|---|---|---|
| `ai-estimate` | Muammo matnidan narx oralig'i (Lovable AI Gateway) | `false` | `LOVABLE_API_KEY` |
| `ai-match` | Mos ustani tanlash | `true` | `LOVABLE_API_KEY` |
| `send-sms` | Eskiz.uz SMS | `false` | `ESKIZ_EMAIL`, `ESKIZ_PASSWORD` |
| `process-payment` | Click / Payme callback | `false` | provider secretlari |

`supabase/config.toml`da faqat kerakli funksiya uchun `verify_jwt = false` yozilgan. Callback yoki public endpoint bo'lmasa **doim `true`**.

---

## 5. Storage bucketlari

| Bucket | Public | Foydalanish |
|---|---|---|
| `avatars` | ✅ | Foydalanuvchi rasmlari |
| `portfolio` | ✅ | Usta portfolio (services.portfolio_urls) |
| `verification-docs` | ❌ | Passport, selfie, sertifikatlar (faqat egasi + admin signed URL orqali) |

Yangi bucket qo'shsangiz: `supabase.storage.create_bucket` + policy (owner read/write, admin ALL).

---

## 6. Xavfsizlik checklist (PR uchun)

- [ ] Yangi `public` jadvalga darhol GRANT + RLS + policy.
- [ ] Sensitiv ustunga `REVOKE SELECT (col)` + owner/admin RPC.
- [ ] `auth`/`storage`/`realtime`/`supabase_functions`/`vault` sxemalariga tegilmagan.
- [ ] `client.ts` / `types.ts` / `.env` — o'zgarmagan.
- [ ] Roles faqat `user_roles`da; admin tekshiruvi faqat `has_role`.
- [ ] Har bir yangi RPC `SECURITY DEFINER`, `SET search_path = public`, va ichida rol/uid tekshiruvi bor.
- [ ] `updated_at` trigger o'rnatilgan.
- [ ] `supabase--linter` ogohlantirishlarsiz.

---

## 7. Yangi jadval shabloni (copy-paste)
```sql
CREATE TABLE public.example (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- domain ustunlari
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.example TO authenticated;
GRANT ALL ON public.example TO service_role;

ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows read"   ON public.example FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own rows write"  ON public.example FOR ALL    TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin all"       ON public.example FOR ALL    TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_example_updated
  BEFORE UPDATE ON public.example
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 8. Definition of Done (backend)

1. Barcha yangi jadval § 0 tartibida yaratilgan (GRANT + RLS + trigger).
2. Sensitiv ustunlar faqat egasi/admin RPC orqali qaytariladi — anon/authenticated to'g'ridan-to'g'ri `SELECT`da ko'ra olmaydi.
3. Rollar faqat `user_roles`da; `has_role` orqali tekshiriladi.
4. `categories` — 2 darajali daraxt, `order_num` orqali tartiblanadi, admin CRUD ishlaydi.
5. `master_profiles.category_ids` — asosiy + sub id'lari birga; GIN indeks kerak bo'lsa qo'shiladi.
6. `verification_requests` oqimi ishlaydi (pending → admin approve/reject → `master_profiles.is_verified`).
7. Har bir admin RPC ichida `has_role` tekshiruvi bor.
8. Edge function'lar `service_role` bilan, ichida JWT tekshiruvi (public callback'lardan tashqari).
9. `supabase--linter` ogohlantirishsiz; `supabase--db_health` yashil.
10. Loyihada demo/soxta ma'lumot yo'q; barcha migration idempotent (`IF NOT EXISTS` / `ON CONFLICT`).
