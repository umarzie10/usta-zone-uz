# Texnik Topshiriq — UstaZone (Umumiy)

**Versiya:** 1.0 &nbsp;|&nbsp; **Sana:** 2026-07-05 &nbsp;|&nbsp; **Auditoriya:** Frontend + Backend jamoasi

UstaZone — O'zbekistondagi 12 viloyat bo'ylab ustalar va mijozlarni bog'lovchi mobile-first veb-platforma. Ushbu hujjat loyihaning **texnik yagona manbasi (single source of truth)** hisoblanadi: frontend va backend qismlar bitta kontraktda birlashtirilgan.

---

## 1. Texnologiya Stack

| Qatlam | Texnologiya |
|---|---|
| Frontend | React 18 + Vite + TypeScript, Tailwind CSS v3, shadcn/ui, React Router v6 |
| State & Data | React Context (`AuthContext`, `AppContext`), Supabase JS client |
| Backend | Lovable Cloud (Supabase: Postgres + Auth + Storage + Edge Functions + Realtime) |
| AI | Lovable AI Gateway (`ai-estimate`, `ai-match` edge functions) |
| Integrations | Eskiz.uz (SMS), Click & Payme (to'lov), Yandex Maps (kelajakda) |
| Testing | Vitest + Testing Library |

---

## 2. Dizayn tili va UX qoidalari

- **Rang:** chuqur ko'k asosli palitra (primary `#1a56db`), light/dark mode qo'llab-quvvatlanadi.
- **Font:** Inter, matnlar **faqat o'zbek tilida** (RU/EN i18n keyingi bosqichda).
- **Mobile-first:** minimal ekran 320px. `overflow-x: hidden` global qoida.
- **Tokenlar:** barcha rang/gradient/shadow qiymatlari `src/index.css` da CSS o'zgaruvchilari sifatida; komponentda hardcoded `text-white`, `bg-black`, `bg-[#...]` **taqiqlanadi**.
- **Animatsiyalar:**
  - Sahifa almashuvi: `.page-enter` (fade + upward slide, 0.55s `cubic-bezier(0.16,1,0.3,1)`), `Layout` ichida `<main key={pathname}>` orqali.
  - Scroll reveal: `useScrollReveal` hook → `.reveal` → viewportga kirganda `.in-view`.
  - Mikro-utility: `.hover-lift`, `.hover-scale`, `.story-link`, `.animate-fade-in-up`, `.animate-bounce-in`, `.animate-float`, `.animate-shimmer`.
  - **Reduced motion:** `@media (prefers-reduced-motion: reduce)` — barcha animatsiya 0.001ms, `.reveal*` darhol ko'rinadi.
- **Responsive:**
  - Tablet (768–1023px) — Navbar hamburger menyu.
  - Matn `truncate` / `line-clamp-*`. Kartochkalar flex ichida `min-w-0`.
  - Formalar: mobile 1 ustun → `sm:` dan 2 ustun grid.

---

## 3. Ma'lumotlar modeli (Postgres)

### 3.1 Umumiy qoidalar
- Har bir `public` sxemasidagi jadval **majburiy tartib**:
  1. `CREATE TABLE`
  2. `GRANT` (roles: `anon` — faqat public read; `authenticated` — CRUD; `service_role` — ALL)
  3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  4. `CREATE POLICY`
- Har bir jadvalda `created_at`, `updated_at` + `update_updated_at_column()` trigger.
- Rollar **faqat `user_roles` jadvalida** saqlanadi (privilege escalation oldini olish). `has_role(uid, role)` — `SECURITY DEFINER` funksiya.
- Sensitiv ustunlar (`card_number`, `phone`, `bank_account`, `tax_info`, `id_document_url` va h.k.):
  - `REVOKE SELECT (col) ON tbl FROM anon, authenticated;`
  - Faqat egasi: `get_my_*` RPC (`SECURITY DEFINER`).
  - Faqat admin: `admin_get_*` / `admin_list_*` RPC (ichida `has_role` tekshiruvi).

### 3.2 Asosiy jadvallar
| Jadval | Vazifasi | Muhim ustunlar |
|---|---|---|
| `profiles` | Barcha foydalanuvchi profillari | `full_name`, `phone` (sensitiv), `region`, `avatar_url` |
| `user_roles` | Rol assignmentlari | `user_id`, `role` (`app_role` enum) |
| `categories` | 2 darajali kategoriya daraxti | `name_uz/ru/en`, `icon`, `color`, `order_num`, `parent_id` (self-FK, `ON DELETE CASCADE`) |
| `master_profiles` | Usta kengaytmasi | `subcategory_ids uuid[]`, `service_radius_km`, `work_days text[]`, `work_start/end`, `accepts_emergency`, `is_verified`, sensitiv hujjatlar |
| `services` | Subkategoriya narxi | `master_id`, `subcategory_id`, `price_type` (`fixed`/`from`/`hourly`), `price`, `is_negotiable`, `experience_years`, `portfolio_urls[]` |
| `verification_requests` | KYC oqimi | `status` (`pending/approved/rejected`), `admin_notes` |
| `orders`, `reviews`, `messages`, `notifications`, `favorites`, `saved_addresses`, `complaints`, `promo_codes`, `subscriptions` | Business flow | — |

### 3.3 Kategoriyalar — 2 darajali daraxt
- `parent_id IS NULL` → asosiy kategoriya; aks holda subkategoriya.
- Indeks: `CREATE INDEX idx_categories_parent ON categories(parent_id);`
- GRANT: `anon` SELECT (public katalog), `authenticated` full CRUD (RLS orqali cheklangan), `service_role` ALL.
- RLS: SELECT hammaga; INSERT/UPDATE/DELETE faqat `has_role(auth.uid(), 'admin')`.

---

## 4. Autentifikatsiya va rollar

- Supabase Auth (email + parol, Google OAuth qo'shilgan).
- Ro'yxatdan o'tish: rol tanlash (`client` / `master`) + majburiy maydonlar (F.I.Sh, telefon, viloyat).
- Anonim signup **taqiqlangan**; auto-confirm email — faqat rasmiy qaror bilan.
- OAuth redirect: `${window.location.origin}/auth/callback` (himoyalangan route'ga to'g'ridan-to'g'ri emas).
- Admin: alohida credential, faqat `has_role('admin')` orqali panelga kiradi.

---

## 5. Frontend arxitekturasi

### 5.1 Papkalar
```
src/
  components/   — qayta ishlatiluvchi UI (shadcn ustidan)
  pages/        — route-level sahifalar
  contexts/     — Auth, App (til, tema, toast)
  hooks/        — useScrollReveal, useSubscriptionStatus, useHeartbeat, ...
  lib/          — i18n, categoryTaxonomy, utils
  integrations/supabase/  — client + generated types (TAHRIRLANMAYDI)
```

### 5.2 Kategoriya boshqaruvi (`AdminCategories.tsx`)
- 2 darajali daraxt: chevron bilan ochish/yopish, rang chipi, sub soni.
- Amallar: `+ Yangi kategoriya`, `+ Sub` (satr ichida), qalam (tahrirlash), savat (o'chirish).
- **Modal state boshqaruvi:** alohida `dialogOpen: boolean` — `openCreate(parentId | null)` / `openEdit(cat)` → `setDialogOpen(true)`; `closeDialog()` — hammasini reset (`newParentId=null` bilan bog'liq eski bug hal qilingan).
- **Tasdiqlash:** o'chirishda shadcn `AlertDialog`; cascade holatida sub soni ko'rsatiladi.
- **Toast:** `sonner` orqali success/error (`Qo'shildi ✅`, `Yangilandi ✅`, `O'chirildi`, error → server xabari).
- **Tartiblash:** har bir satrda ArrowUp/ArrowDown — `swapOrder(a, b)` ikkita `UPDATE` orqali `order_num` almashtiradi + optimistic local update.
- Modal maydonlari: `name_uz` (majburiy), `name_ru`, `name_en` (bo'sh bo'lsa UZ qiymati), `icon` (lucide slug), `color` (hex).

### 5.3 Master onboarding / kabinet
- `RegisterMaster.tsx` va `MasterSettingsForm.tsx` — bir xil forma logikasi.
- Asosiy kategoriyalar chip; tanlanganda subkategoriyalar ochiladi.
- Har bir tanlangan subkategoriya uchun `SubcategoryPricing`: `price_type`, boshlang'ich narx, kelishilgan bool, tajriba yili, portfolio rasmlari.
- Radius, ish kunlari, ish vaqti, emergency qabul qilish.
- Hujjatlar: passport, selfie, sertifikatlar (Storage bucket).

### 5.4 Find Master (`FindMaster.tsx`)
- Kategoriya + **subkategoriya filtri** (DB'dan `parent_id` bo'yicha yuklanadi, hardcoded taxonomy emas).
- Viloyat, reyting, verifikatsiya, emergency, narx filtrlari.
- Master `services` yoki `master_profiles.subcategory_ids` orqali mos kelsa ko'rinadi.

### 5.5 Sahifa animatsiyalari
- `Layout.tsx`: `<main key={pathname} className="page-enter">`.
- Yangi sahifa qo'shishda hech qanday qo'shimcha kod shart emas.
- Testlar: `src/test/pageTransition.test.tsx` — `page-enter` klassining borligi va route o'zgarganda re-mount tekshiriladi. `setup.ts` da `IntersectionObserver` va `matchMedia` mock qilingan.

---

## 6. Backend qatlami

### 6.1 RPC-lar (mavjud)
| RPC | Kirish | Kim chaqiradi |
|---|---|---|
| `get_my_profile()` | — | Har qanday auth foydalanuvchi (o'zi) |
| `get_my_master_profile()` | — | Master (o'zi) |
| `admin_list_profiles()` | — | Admin |
| `admin_get_profiles(uid[])` | uuid[] | Admin |
| `admin_get_master_profile(uid)` | uuid | Admin |
| `has_role(uid, role)` | uid, app_role | Ichki (RLS) |
| `get_my_subscription_status()` | — | Auth foydalanuvchi |

### 6.2 Edge Functions
| Funksiya | Vazifasi | Secrets |
|---|---|---|
| `ai-estimate` | Muammo tavsifidan narx oralig'i | Lovable AI Gateway (auto) |
| `ai-match` | Mos ustani tanlash | Lovable AI Gateway |
| `send-sms` | SMS yuborish | `ESKIZ_EMAIL`, `ESKIZ_PASSWORD` |
| `process-payment` | Click / Payme | Provider secretlari |

Har bir edge function `service_role` bilan ishlaydi, ichida `auth.uid()` yoki JWT tekshiradi.

### 6.3 Verifikatsiya oqimi
1. Master hujjat + selfi yuklaydi → `verification_requests.status = 'pending'`.
2. Admin `AdminVerificationPanel` orqali `approved` / `rejected` qiladi (rejectda `admin_notes` majburiy).
3. `approved` → `master_profiles.is_verified = true` → UIda "Verified Usta" belgisi.

### 6.4 Storage bucketlari
- `avatars` (public read), `portfolio` (public read), `documents` (private — faqat egasi + admin), `chat-media` (auth).

---

## 7. Xavfsizlik checklist (majburiy)

- [ ] Yangi `public` jadvalga **darhol** GRANT + RLS + policy.
- [ ] Sensitiv ustunlarga `REVOKE SELECT (col)` + owner/admin RPC.
- [ ] `auth`, `storage`, `realtime`, `supabase_functions`, `vault` sxemalariga **tegilmaydi**.
- [ ] `src/integrations/supabase/client.ts`, `types.ts`, `.env` — **tahrirlanmaydi** (auto-generated).
- [ ] Rollarni hech qachon `profiles`ga qo'shmaslik.
- [ ] Admin tekshiruvi — faqat `has_role(auth.uid(), 'admin')`, hech qachon localStorage/hardcoded.

---

## 8. Testlash

- **Unit:** `vitest` (`bunx vitest run`).
- **Mavjud testlar:**
  - `src/test/pageTransition.test.tsx` — sahifa animatsiya + reduced motion.
  - `src/test/example.test.ts` — sanity.
- **Mock:** `IntersectionObserver`, `matchMedia` — `src/test/setup.ts`.
- Yangi feature → yangi test (minimum happy-path).

---

## 9. Definition of Done (loyiha darajasida)

1. Admin kategoriya/subkategoriyani qo'sha, tahrirlay, o'chira, **tartiblay** oladi; barcha amal tasdiqlash modal + toast bilan.
2. Master onboarding: subkategoriya, narx, radius, ish vaqti, hujjatlar saqlanadi va kabinetda tahrirlanadi.
3. Client Find Master sahifasida subkategoriya bo'yicha filtr ishlaydi (DB-driven).
4. Barcha route almashuvida silliq fade+slide animatsiya; reduced-motion muhitda darhol ko'rinadi.
5. 320px dan boshlab hech qaysi ekranda matn ustma-ust chiqmaydi; Navbar tablet'da hamburger.
6. Barcha yangi `public` jadval GRANT + RLS + `updated_at` trigger bilan yaratilgan.
7. Sensitiv ma'lumotlar faqat egasi va admin RPC'lari orqali olinadi — `anon`/`authenticated` to'g'ridan-to'g'ri SELECT qila olmaydi.
8. Verifikatsiya statusi kuzatiladi va "Verified Usta" bayrog'iga bog'lanadi.
9. `bunx vitest run` yashil; build ogohlantirishlarsiz.
10. Loyihada hech qanday demo/soxta ma'lumot yo'q — faqat real ma'lumotlar.

---

## 10. Ishni yuritish tartibi (Frontend ↔ Backend kontrakt)

1. **Yangi feature:** ushbu hujjatga tegishli bo'lim qo'shiladi/yangilanadi.
2. **DB o'zgarish:** Backend migration yozadi (GRANT + RLS + trigger). Frontend `types.ts` avtomatik yangilanishini kutadi.
3. **Yangi RPC/Edge Function:** kontrakt (kirish/chiqish) shu hujjatning 6-bo'limiga qo'shiladi.
4. **UI komponent:** dizayn tokenlaridan foydalanadi, Tailwind semantic klasslar; hardcoded rang taqiqlangan.
5. **PR checklist:** § 7 Xavfsizlik + § 9 DoD punktlari.
