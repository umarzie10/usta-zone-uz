# USTAZONE — Yagona To'liq Texnik Topshiriq (Developer Edition)

**Versiya:** 4.0 | **Sana:** 2026-08-09 | **Status:** Production
Bu hujjat loyihaning **yagona manbasi**. `TZ.md`, `TZ-FRONTEND*.md`, `TZ-BACKEND*.md` — arxiv.

---

## 0. Oxirgi o'zgarishlar (v4.0)

- Global suzuvchi (floating) AI tugmasi **butun saytdan olib tashlandi** (`Layout.tsx` da `<AIAssistant />` yo'q).
- AI yordamchi endi **faqat kabinet ichida**, alohida bo'lim (tab) sifatida:
  - Mijoz kabineti: `Faol buyurtmalar · Sevimlilar · Manzillar · Xabarlar · Sharhlar · Balans · Referral · AI yordamchi`
  - Usta kabineti: `... Tarix · AI yordamchi`
- `AIAssistant` komponentiga `embedded?: boolean` prop qo'shildi:
  - `embedded` — inline panel (kabinet tab ichida, `min-h-[300px]`, `max-h-[55vh]`).
  - `embedded` yo'q — eski floating rejim (hozir hech qayerda ishlatilmaydi, kelajak uchun qoldirilgan).

---

## 1. Umumiy

UstaZone — O'zbekiston (12 viloyat) bo'ylab mijoz va ustalarni bog'lovchi mobile-first marketplace SaaS.
Rollar: **client**, **master**, **admin**.

### 1.1 Stack
| Qatlam | Texnologiya |
|---|---|
| Frontend | React 18, Vite 5, TypeScript 5, Tailwind v3, shadcn/ui, React Router v6 |
| State | React Context (`AuthContext`, `AppContext`), TanStack Query |
| Backend | Lovable Cloud (Postgres + Auth + Storage + Edge Functions + Realtime) |
| AI | Lovable AI Gateway (`google/gemini-3-flash-preview`) |
| Charts/Export | Recharts, jspdf, xlsx |
| SEO | react-helmet-async, JSON-LD, dinamik sitemap |
| Test | Vitest + Testing Library |

### 1.2 Dizayn qoidalari
- Primary `#1a56db` (deep blue), Inter, light/dark.
- **Faqat `src/index.css` semantik tokenlari.** `text-white`, `bg-[#...]` taqiqlangan.
- Mobile-first (min 320px), global `overflow-x: hidden`.
- Animatsiyalar: `.page-enter`, `.reveal/.in-view` (`useScrollReveal`), `.hover-lift`, `.stat-card`, `.stagger`, `.tab-panel`, `AnimatedCounter`.
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
CREATE POLICY ...;
```
Har jadvalda `created_at`/`updated_at` + `update_updated_at_column()` trigger.

### 2.2 Jadvallar

**Identity**
| Jadval | Vazifa |
|---|---|
| `profiles` | `full_name`, `phone`*, `region`, `city`, `avatar_url`, `latitude/longitude`*, `last_seen_at`, `bonus_balance`, `referral_code`, `referred_by` |
| `user_roles` | `app_role`: client/master/admin. **Rol hech qachon `profiles`da saqlanmaydi** |
| `master_profiles` | `bio`, `category_ids[]`, `subcategory_ids[]`, `skills[]`, `portfolio_urls[]`, `rating`, `jobs_completed`, `service_radius_km`, `work_days[]`, `work_start/end`, `accepts_emergency`, `verification_tier`, `founding_number`, hujjatlar* |
| `verification_requests` | KYC: `pending/approved/rejected`, `requested_tier` |

**Katalog:** `categories` (2 darajali daraxt, `parent_id`, `name_uz/ru/en`, `icon`, `color`, `order_num`, `slug`), `services` (`fixed`/`from`/`hourly`), `master_availability`.

**Buyurtma:** `orders`, `order_escrow`, `warranty_claims`, `reviews`, `complaints`.

**Moliya:** `wallets`, `wallet_transactions`, `wallet_withdrawals`, `bank_cards`, `transactions`, `withdraw_requests`, `platform_settings`.

**O'sish:** `subscriptions`, `subscription_plans`, `promo_codes`, `promo_redemptions`, `referrals`, `broadcasts`, `notifications`, `messages`, `favorite_masters`, `saved_addresses`, `audit_logs`.

\* sensitiv ustunlar: `REVOKE SELECT (col)` + faqat `get_my_*` / `admin_*` RPC.

### 2.3 Enumlar
`app_role`, `subscription_tier`, `verification_tier`, `wallet_tx_type`, `wallet_tx_status`, `withdrawal_status`.

---

## 3. Backend kontrakt

### 3.1 Profil / rol
`has_role(uid, role)`, `get_my_profile()`, `get_my_master_profile()`, `admin_list_profiles()`, `admin_get_profiles(uuid[])`, `admin_get_master_profile(uid)`, `admin_delete_user(uid)`.

### 3.2 Buyurtma / escrow / kafolat
`escrow_hold(order_id)`, `escrow_release(order_id)` (`warranty_until = now()+7d`), `escrow_refund(order_id, note)`,
`create_warranty_claim(order_id, reason, photos[])` → `{ok}` | `{error: warranty_expired|not_found}`,
`admin_resolve_warranty(id, resolution, note)`, `admin_list_warranty_claims()`, `claim_emergency_order(order_id)` (atomik).

### 3.3 Hamyon
`get_my_wallet()`, `wallet_deposit(amount, method)`, `wallet_request_withdrawal(amount, card_id, otp)`,
`admin_review_withdrawal(id, decision, note)`, `admin_list_withdrawals()`, `admin_list_wallet_transactions(limit)`, `admin_wallet_overview()`.
**OTP:** yechishda 6 xonali kod; `otp_verified` bo'lmasa admin ko'rmaydi.

### 3.4 Moliya
`get_commission_percent()` (default 10). `commission = amount*pct/100`, `master_amount = amount - commission`.

### 3.5 Obuna / o'sish
`get_my_subscription_status()`, `activate_subscription(tier, months)`, `master_can_accept_orders(uid)`, `master_can_add_service(uid)`,
`apply_promo_code(code, amount)`, `redeem_promo_code(...)`, `award_cashback(order_id)` (1%),
`get_my_referral_code()`, `ensure_my_referral_code()`, `get_my_referral_stats()`, `get_my_referral_list()`,
`get_founding_config()`, `admin_resync_founding_numbers()`, `admin_send_broadcast(audience, title, message, send_sms)`.

### 3.6 Matching
`master_match_score(master_id, client_lat, client_lng)` — reyting + bajarilgan ishlar + tarif + Haversine masofa.

### 3.7 Edge Functions
| Funksiya | Vazifa | Secrets |
|---|---|---|
| `ai-estimate` | matn → narx oralig'i | Lovable AI (auto) |
| `ai-match` | muammo → mos usta | Lovable AI |
| `ai-assistant` | kabinet ichidagi yordamchi chat | Lovable AI |
| `send-sms` | Eskiz.uz | `ESKIZ_EMAIL`, `ESKIZ_PASSWORD` |
| `process-payment` | Click / Payme / naqd | provider secretlari |

Har biri CORS + JWT tekshiruvi bilan. `ai-assistant` oxirgi 20 ta xabarni yuboradi, 429/402 xatolarini foydalanuvchiga tushunarli matn bilan qaytaradi.

### 3.8 Storage
`avatars` (public), `portfolio` (public, owner-only UPDATE policy), `documents` (private — egasi + admin), `chat-media` (auth).

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

### 4.2 Kabinet bo'limlari (tab kontrakti)

**Mijoz paneli** (`src/pages/ClientDashboard.tsx`, `tabs` massivi):
| id | Label | Komponent |
|---|---|---|
| `orders` | Faol buyurtmalar | inline ro'yxat + Baholash/Xabar/Kafolat tugmalari |
| `favorites` | Sevimlilar | `FavoriteMasters` |
| `addresses` | Manzillar | `SavedAddresses` |
| `messages` | Xabarlar | `ChatDialog` orqali |
| `reviews` | Sharhlar | inline sharhlar ro'yxati |
| `balance` | Balans | `UserWallet` |
| `referral` | Referral | `ReferralDashboard` |
| `ai` | AI yordamchi | `<AIAssistant embedded />` |

Yuqorida: statistika kartalari (jami/faol/bajarilgan buyurtma, bonus balans) + `TrialCountdown`.

**Usta paneli** (`src/pages/MasterDashboard.tsx`):
`overview · profile · settings · pricing · verification · portfolio · schedule · balance · reviews · history · ai`
Oxirgi `ai` tab — `<AIAssistant embedded />`.

**Admin paneli:** foydalanuvchilar, ustalar + verifikatsiya, kategoriya daraxti CRUD + sort, buyurtmalar, komissiya foizi, hamyon/yechish, shikoyatlar, chat monitoring, kafolat, promo kodlar, obuna tariflari CRUD, "Asoschi Usta" konfiguratsiyasi, broadcast, moliya grafiklari.

### 4.3 AI yordamchi komponenti (`src/components/AIAssistant.tsx`)
```tsx
<AIAssistant embedded />   // kabinet tab ichida — hozirgi yagona ishlatilishi
<AIAssistant />            // floating rejim (saytda ishlatilmaydi)
```
- `messages: {role, content}[]` local state; birinchi xabar — salomlashuv.
- Boshlang'ich 3 ta taklif-tugma (faqat `messages.length <= 1` bo'lsa).
- Yuborish: `supabase.functions.invoke('ai-assistant', { body: { messages } })`.
- Xato bo'lsa — foydalanuvchiga muloyim fallback matn, konsolga chiqmaydi.
- Yozayotganda `Loader2` + "Yozmoqda..." indikatori, har xabardan keyin `scrollIntoView`.
- Input `maxLength = 500`, bo'sh matn/loading holatida submit disabled.

### 4.4 Boshqa muhim komponentlar
`Layout` (page-enter + trial banner; **AI yo'q**), `AIMasterMatch`, `QuickOrder`, `NearestMasters`, `TopMasters`,
`SubscriptionGuard`, `TrialCountdown`, `FirstLoginTrialBanner`, `FoundingMasterBadge`, `WarrantyClaimDialog`,
`SubcategoryPricing`, `MasterSettingsForm`, `AdminCategories`, `AdminVerificationPanel`, `AdminWarranty`,
`AdminPromoCodes`, `AdminBroadcast`, `AdminFoundingSettings`, `AdminChatMonitor`, `RevenueChart`.

---

## 5. Biznes qoidalari

1. **Komissiya** — admin sozlaydi (default 10%), hamma joyda `get_commission_percent()`.
2. **Escrow** — onlayn to'lovda `held`, ikkala tomon tasdiqlasa `released`.
3. **Kafolat** — yakunlashdan 7 kun; muddat o'tsa RPC `warranty_expired`.
4. **Cashback** — bajarilgan buyurtmadan mijozga 1% bonus.
5. **Referral** — taklif qilingan foydalanuvchi birinchi buyurtmani yakunlaganda referrerga 10 000 so'm.
6. **Trial** — usta ro'yxatdan o'tganda Pro trial; tugagach profil ma'lumotlari yopiladi (`SubscriptionGuard`), banner faqat 1 marta ko'rsatiladi.
7. **Asoschi Usta** — birinchi N ta usta (admin konfiguratsiyasi) ketma-ket raqam oladi.
8. **Emergency** — birinchi bosgan usta oladi, qolganlarga "band".

---

## 6. Xavfsizlik checklist

- [ ] Yangi `public` jadval → GRANT + RLS + policy bitta migrationda.
- [ ] Sensitiv ustun → `REVOKE SELECT (col)` + owner/admin RPC.
- [ ] Rollar faqat `user_roles`da; admin tekshiruvi `has_role(auth.uid(),'admin')`.
- [ ] `auth`, `storage`, `realtime`, `supabase_functions`, `vault` sxemalariga tegilmaydi.
- [ ] `client.ts`, `types.ts`, `.env` — auto-generated.
- [ ] Anonim signup yo'q; OAuth redirect `${origin}/auth/callback`.
- [ ] `LOVABLE_API_KEY` faqat Edge Function ichida.

---

## 7. SEO & PWA

- `SeoHead`: title <60, description <160, canonical, OG/Twitter.
- JSON-LD: `LocalBusiness`, `FAQPage`, `Service`.
- `scripts/generate-sitemap.ts` → `public/sitemap.xml`; `robots.txt`.
- PWA: `public/manifest.webmanifest` + `public/sw.js`, install prompt.

---

## 8. Test va DoD

- `bunx vitest run` yashil (`pageTransition.test.tsx`, `example.test.ts`; mocklar `src/test/setup.ts`).
- Har yangi feature → minimum happy-path test.
- **DoD:** GRANT+RLS bor; sensitiv data faqat RPC orqali; 320px dan layout buzilmaydi; reduced-motion ishlaydi; demo/soxta ma'lumot yo'q; build ogohlantirishsiz; saytning hech bir sahifasida floating AI tugmasi yo'q.

---

## 9. Ish tartibi

1. Yangi feature → shu hujjatga bo'lim.
2. DB o'zgarish → migration (GRANT + RLS + trigger).
3. Yangi RPC/Edge Function → §3 ga kontrakt.
4. UI → faqat semantik tokenlar.
5. PR checklist → §6 + §8.
