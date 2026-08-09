# USTAZONE — To'liq Texnik Topshiriq (Developer Edition)

**Versiya:** 3.0 | **Sana:** 2026-08-09 | **Status:** Production-ready
Ushbu hujjat loyihaning yagona texnik manbasi. Oldingi `TZ.md`, `TZ-FRONTEND*.md`, `TZ-BACKEND*.md` shu hujjatga birlashtirilgan.

---

## 1. Umumiy ma'lumot

UstaZone — O'zbekiston bo'ylab (12 viloyat) mijoz va ustalarni bog'lovchi mobile-first marketplace SaaS platforma.
Uchta rol: **client**, **master**, **admin**.

### 1.1 Stack

| Qatlam | Texnologiya |
|---|---|
| Frontend | React 18, Vite 5, TypeScript 5, Tailwind v3, shadcn/ui, React Router v6 |
| State | React Context (`AuthContext`, `AppContext`), TanStack Query |
| Backend | Lovable Cloud (Postgres + Auth + Storage + Edge Functions + Realtime) |
| AI | Lovable AI Gateway (`google/gemini-2.5-flash`) |
| Charts / Export | Recharts, jspdf, xlsx |
| SEO | react-helmet-async, JSON-LD, dinamik sitemap |
| Test | Vitest + Testing Library |

### 1.2 Dizayn qoidalari
- Primary `#1a56db` (deep blue), Inter font, light/dark mode.
- **Barcha rang/gradient/shadow — faqat `src/index.css` dagi semantik tokenlar.** `text-white`, `bg-[#...]` taqiqlangan.
- Mobile-first, min 320px, `overflow-x: hidden` global.
- Animatsiyalar: `.page-enter`, `.reveal/.in-view` (`useScrollReveal`), `.hover-lift`, `.stat-card`, `.stagger`, `AnimatedCounter`.
- `prefers-reduced-motion` → barcha animatsiya 0.001ms.

---

## 2. Ma'lumotlar modeli

### 2.1 Majburiy migration tartibi
```sql
CREATE TABLE public.x (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.x TO authenticated;
GRANT ALL ON public.x TO service_role;
-- GRANT SELECT ON public.x TO anon;  -- faqat public o'qish kerak bo'lsa
ALTER TABLE public.x ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ;
```
Har jadvalda `created_at`/`updated_at` + `update_updated_at_column()` trigger.

### 2.2 Jadvallar (domenlar bo'yicha)

**Identity**
| Jadval | Vazifa |
|---|---|
| `profiles` | `full_name`, `phone`*, `region`, `city`, `avatar_url`, `latitude/longitude`, `last_seen_at`, `bonus_balance`, `referral_code`, `referred_by` |
| `user_roles` | rol assignment (`app_role`: client/master/admin). **Rol hech qachon `profiles`da saqlanmaydi** |
| `master_profiles` | `bio`, `category_ids[]`, `subcategory_ids[]`, `skills[]`, `portfolio_urls[]`, `rating`, `jobs_completed`, `service_radius_km`, `work_days[]`, `work_start/end`, `accepts_emergency`, `verification_tier`, `founding_number`, hujjatlar* |
| `verification_requests` | KYC oqimi: `pending/approved/rejected`, `requested_tier` |

**Katalog**
| `categories` | 2 darajali daraxt (`parent_id` self-FK), `name_uz/ru/en`, `icon`, `color`, `order_num`, `slug` |
| `services` | usta narxlari: `pricing_type` (`fixed`/`from`/`hourly`), `price`, `price_max`, `estimated_hours` |
| `master_availability` | hafta kunlari bo'yicha ish oynasi |

**Buyurtma oqimi**
| `orders` | `status`, `payment_method`, `amount`, `commission_amount`, `master_amount`, `escrow_status`, `warranty_until`, `client_confirmed`, `master_confirmed`, `is_dispute` |
| `order_escrow` | `held → released / refunded` |
| `warranty_claims` | 7 kunlik kafolat murojaatlari |
| `reviews` | 1–5 reyting, `photo_urls[]`, `video_url` |
| `complaints` | shikoyat CRM |

**Moliya**
| `wallets` | `balance`, `frozen_balance`, `total_deposited/spent/withdrawn` |
| `wallet_transactions` | `ref_code`, `type` (deposit/withdrawal/payment/refund/bonus/earning/commission), `status` |
| `wallet_withdrawals` | OTP tasdiqlash bilan yechish |
| `bank_cards` | maskalangan karta (`card_last4`, `card_masked`) |
| `transactions`, `withdraw_requests` | legacy moliya jurnali |
| `platform_settings` | admin sozlamalari (`commission_percent`, founding config) |

**O'sish**
| `subscriptions`, `subscription_plans` | tarif + trial |
| `promo_codes`, `promo_redemptions` | chegirmalar |
| `referrals` | taklif dasturi (10 000 so'm bonus) |
| `broadcasts`, `notifications`, `messages` | kommunikatsiya |
| `favorite_masters`, `saved_addresses` | mijoz qulayliklari |
| `audit_logs` | admin harakatlari |

\* — sensitiv ustunlar: `REVOKE SELECT (col)` + faqat `get_my_*` / `admin_*` RPC orqali.

### 2.3 Enumlar
`app_role`, `subscription_tier`, `verification_tier`, `wallet_tx_type`, `wallet_tx_status`, `withdrawal_status`.

---

## 3. Backend kontrakt (RPC)

### 3.1 Profil / rol
| RPC | Kirish | Chiqish |
|---|---|---|
| `has_role(uid, role)` | uuid, app_role | boolean |
| `get_my_profile()` / `get_my_master_profile()` | — | SETOF row |
| `admin_list_profiles()` / `admin_get_profiles(uuid[])` / `admin_get_master_profile(uid)` | — | SETOF profiles |
| `admin_delete_user(uid)` | uuid | void |

### 3.2 Buyurtma / escrow / kafolat
| `escrow_hold(order_id)` | mijoz to'lovi bloklanadi | `{ok}` |
| `escrow_release(order_id)` | usta hisobiga o'tkaziladi, `warranty_until = now()+7d` | `{ok}` |
| `escrow_refund(order_id, note)` | mijozga qaytariladi | `{ok}` |
| `create_warranty_claim(order_id, reason, photos[])` | `{ok}` yoki `{error: warranty_expired|not_found}` |
| `admin_resolve_warranty(id, resolution, note)` / `admin_list_warranty_claims()` |
| `claim_emergency_order(order_id)` | birinchi bosgan usta oladi (atomik) |

### 3.3 Hamyon
`get_my_wallet()`, `wallet_deposit(amount, method)`, `wallet_request_withdrawal(amount, card_id, otp)`,
`admin_review_withdrawal(id, decision, note)`, `admin_list_withdrawals()`, `admin_list_wallet_transactions(limit)`, `admin_wallet_overview()`.

**OTP:** yechish so'rovida 6 xonali kod generatsiya qilinadi → `otp_verified` bo'lmasa admin ko'rmaydi.

### 3.4 Moliya sozlamalari
`get_commission_percent()` — `platform_settings.commission_percent` (default 10). Frontend va `process-payment` shu qiymatdan foydalanadi.
`commission = amount * pct/100`, `master_amount = amount - commission`.

### 3.5 Obuna / o'sish
`get_my_subscription_status()`, `activate_subscription(tier, months)`, `master_can_accept_orders(uid)`, `master_can_add_service(uid)`,
`apply_promo_code(code, amount)`, `redeem_promo_code(...)`, `award_cashback(order_id)` (1%),
`get_my_referral_code()`, `ensure_my_referral_code()`, `get_my_referral_stats()`, `get_my_referral_list()`,
`get_founding_config()`, `admin_resync_founding_numbers()`, `admin_send_broadcast(audience, title, message, send_sms)`.

### 3.6 Matching
`master_match_score(master_id, client_lat, client_lng)` → reyting, bajarilgan ishlar, tarif darajasi va Haversine masofa asosida ball.

### 3.7 Edge Functions
| Funksiya | Vazifa | Secrets |
|---|---|---|
| `ai-estimate` | matn → narx oralig'i | Lovable AI (auto) |
| `ai-match` | muammo → mos usta | Lovable AI |
| `ai-assistant` | sayt bo'ylab yordamchi chat | Lovable AI |
| `send-sms` | Eskiz.uz | `ESKIZ_EMAIL`, `ESKIZ_PASSWORD` |
| `process-payment` | Click / Payme / cash | provider secretlari |

Har bir function CORS + `Authorization` JWT tekshiruvi bilan.

### 3.8 Storage
`avatars` (public), `portfolio` (public), `documents` (private — egasi + admin), `chat-media` (auth).

---

## 4. Frontend arxitektura

```
src/
  components/            umumiy UI + domen komponentlari
    wallet/              UserWallet, MasterWallet, AdminWallet
    ui/                  shadcn
  pages/                 route-level sahifalar
  contexts/              AuthContext, AppContext
  hooks/                 useScrollReveal, useHeartbeat, useSubscriptionStatus, useRealtimePresence
  lib/                   i18n, categoryTaxonomy, walletExport, utils
  integrations/supabase/ client.ts + types.ts (TAHRIRLANMAYDI)
```

### 4.1 Routelar
`/`, `/masters`, `/find-master`, `/master/:id`, `/categories`, `/category/:slug`, `/city/:slug`,
`/order/create`, `/subscription`, `/live-map`, `/login`, `/register-master`,
`/dashboard/client`, `/dashboard/master`, `/admin`.

### 4.2 Panellar

**Mijoz paneli** — buyurtmalar, chat, sevimli ustalar, saqlangan manzillar, hamyon (to'ldirish/tarix/eksport), taklif dashboard, kafolat murojaati, obuna (Free/Pro/VIP).

**Usta paneli** — profil sozlamalari (kategoriya, subkategoriya narxlari, radius, ish vaqti, hujjatlar), buyurtmalar, xizmatlar CRUD, hamyon + daromad grafigi + yechish, verifikatsiya markazi, trial countdown banner, obuna (Basic/Pro/VIP).

**Admin paneli** — foydalanuvchilar, ustalar va verifikatsiya, kategoriya daraxti CRUD + sort, buyurtmalar, komissiya foizi, hamyon/yechish so'rovlari, shikoyatlar, chat monitoring, kafolat, promo kodlar, obuna tariflari CRUD, "Asoschi Usta" konfiguratsiyasi, broadcast, moliya grafiklari.

### 4.3 Muhim komponentlar
`Layout` (page-enter + AIAssistant + trial banner), `AIMasterMatch`, `QuickOrder`, `NearestMasters`, `TopMasters`,
`SubscriptionGuard` (paywall), `TrialCountdown`, `FoundingMasterBadge`, `WarrantyClaimDialog`, `SubcategoryPricing`,
`AdminCategories`, `AdminVerificationPanel`, `AdminWarranty`, `AdminPromoCodes`, `AdminBroadcast`, `AdminFoundingSettings`.

---

## 5. Biznes qoidalari

1. **Komissiya** — admin sozlaydi (default 10%), barcha hisob-kitob `get_commission_percent()` orqali.
2. **Escrow** — onlayn to'lovda pul `held`, ikkala tomon tasdiqlagach `released`.
3. **Kafolat** — ish yakunidan 7 kun. Muddat o'tsa RPC `warranty_expired` qaytaradi.
4. **Cashback** — bajarilgan buyurtmadan mijozga 1% bonus.
5. **Referral** — taklif qilingan foydalanuvchi birinchi buyurtmani yakunlaganda referrerga 10 000 so'm.
6. **Trial** — usta ro'yxatdan o'tganda Pro trial; tugagach profil ma'lumotlari yopiladi (`SubscriptionGuard`).
7. **Asoschi Usta** — birinchi N ta usta (admin konfiguratsiyasi) ketma-ket raqam oladi.
8. **Emergency** — birinchi bosgan usta buyurtmani oladi, qolganlarga "band" xabari.

---

## 6. Xavfsizlik checklist

- [ ] Yangi `public` jadval → GRANT + RLS + policy bir migrationda.
- [ ] Sensitiv ustun → `REVOKE SELECT (col)` + owner/admin RPC.
- [ ] Rollar faqat `user_roles`da; admin tekshiruvi faqat `has_role(auth.uid(),'admin')`.
- [ ] `auth`, `storage`, `realtime`, `supabase_functions`, `vault` sxemalariga tegilmaydi.
- [ ] `client.ts`, `types.ts`, `.env` — auto-generated, tahrirlanmaydi.
- [ ] Anonim signup yo'q; OAuth redirect `${origin}/auth/callback`.

---

## 7. SEO & PWA

- `SeoHead` komponenti: title <60, description <160, canonical, OG/Twitter.
- JSON-LD: `LocalBusiness`, `FAQPage`, `Service` — landing sahifalarda.
- `scripts/generate-sitemap.ts` → `public/sitemap.xml`; `robots.txt` mavjud.
- PWA: `public/manifest.webmanifest` + `public/sw.js` (offline cache), install prompt.

---

## 8. Testlash va DoD

- `bunx vitest run` yashil (`pageTransition.test.tsx`, `example.test.ts`; mocklar `src/test/setup.ts`).
- Har yangi feature → minimum happy-path test.
- **DoD:** GRANT+RLS bor; sensitiv data faqat RPC orqali; 320px dan boshlab layout buzilmaydi; reduced-motion ishlaydi; demo/soxta ma'lumot yo'q; build ogohlantirishsiz.

---

## 9. Ish tartibi

1. Yangi feature → shu hujjatga bo'lim qo'shiladi.
2. DB o'zgarish → migration (GRANT + RLS + trigger), `types.ts` avtomatik yangilanadi.
3. Yangi RPC/Edge Function → §3 ga kontrakt yoziladi.
4. UI → faqat semantik tokenlar.
5. PR checklist → §6 + §8.
