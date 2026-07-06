# Texnik Topshiriq — Backend (UstaZone) · FINAL 10/10

**Versiya:** Final v2 &nbsp;|&nbsp; **Sana:** 2026-07-06 &nbsp;|&nbsp; **Auditoriya:** Backend jamoasi
**Platforma:** Lovable Cloud (Supabase: Postgres 15 + Auth + Storage + Edge Functions + Realtime)

Ushbu hujjat backend dasturchi uchun **yagona manba**. Bo'limlar: umumiy qoidalar → sxema → RLS → RPC → Edge Functions → **Order Flow** → **AI Match** → Payments → Subscriptions → Notifications → Realtime → Xavfsizlik → DoD.

---

## 0. Umumiy qoidalar (majburiy)

1. Har bir `public.<jadval>` yaratishda **qat'iy tartib**:
   ```
   CREATE TABLE  →  GRANT  →  ENABLE RLS  →  CREATE POLICY
   ```
   GRANT bo'lmasa PostgREST `permission denied` qaytaradi.

2. GRANT shabloni:
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO authenticated;
   GRANT ALL ON public.<t> TO service_role;
   GRANT SELECT ON public.<t> TO anon;  -- faqat public read kerak bo'lsa
   ```

3. Har bir jadvalda `created_at`, `updated_at` + trigger `update_updated_at_column()`.

4. **Rollarni faqat `user_roles`**da saqlash. Tekshiruv: `has_role(auth.uid(),'admin')`.

5. **Sensitiv ustunlar** (`phone`, `card_number`, `bank_account`, `tax_info`, `id_document_url`, `selfie_url`, `certificate_urls`):
   - `REVOKE SELECT (col) FROM anon, authenticated;`
   - Egasi: `get_my_*` RPC. Admin: `admin_get_*` RPC.

6. **Tegilmaydi:** `auth`, `storage`, `realtime`, `supabase_functions`, `vault` sxemalari; `src/integrations/supabase/client.ts` va `types.ts`.

7. `ALTER DATABASE postgres ...` **taqiqlangan**.

8. CHECK constraint faqat immutable ifodalar uchun. `now()`/`current_user` uchun — trigger.

---

## 1. Rollar va autentifikatsiya

### `app_role` enum
`'client' | 'master' | 'admin'`

### `user_roles`
```sql
CREATE TABLE public.user_roles (
  id uuid PK DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
```

### `has_role`
`SECURITY DEFINER STABLE SET search_path = public` — rekursiv RLS'ni oldini oladi.

### `handle_new_user` trigger
`auth.users` INSERT → `profiles` + `user_roles` + boshlang'ich `subscriptions` (master `pro` 30 kun trial / client `pro` 7 kun trial).

---

## 2. Asosiy jadvallar

### 2.1 `profiles`
`user_id UNIQUE`, `full_name`, `phone` (**sensitiv**), `city`, `region`, `role`, `avatar_url`, `is_verified`, `is_blocked`, `bonus_balance`, `latitude/longitude`.

### 2.2 `categories` (2 darajali daraxt)
`name_uz/ru/en`, `icon`, `color`, `order_num`, `parent_id → categories(id) ON DELETE CASCADE`, `slug`.
Indeks: `idx_categories_parent`. Admin CRUD `has_role('admin')`; SELECT hamma.

### 2.3 `master_profiles`
`user_id UNIQUE`, `bio`, `experience_years`, `rating`, `jobs_completed`, `is_verified`, `verification_tier`, `balance`, `withdrawable_balance`.
Kategoriyalar: `category_ids uuid[]` (asosiy + sub birga). Onboarding: `service_radius_km`, `work_days text[]`, `work_start/end time`, `accepts_emergency bool`.
**Sensitiv**: `id_document_url`, `selfie_url`, `certificate_urls`, `card_number`, `bank_account`, `tax_info`.
Indeks: `USING GIN (category_ids)`.

### 2.4 `services`
`master_id`, `subcategory_id`, `price_type ('fixed'|'from'|'hourly')`, `price`, `is_negotiable`, `experience_years`, `portfolio_urls[]`.
Limit: free tier 3 tagacha (`master_can_add_service`).

### 2.5 `orders` — **to'liq sxema**

| Ustun | Tip | Izoh |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid NOT NULL → auth.users | Buyurtmachi |
| `master_id` | uuid NULL → auth.users | Accept qilingandan keyin to'ladi |
| `category_id` | uuid → categories | Sub yoki asosiy |
| `title` | text NOT NULL | Qisqa sarlavha |
| `description` | text | Muammo tavsifi |
| `city` / `address` | text | Manzil |
| `payment_method` | text default `'cash'` | `cash`/`click`/`payme`/`bonus` |
| `status` | text default `'pending'` | § 4dagi state machine |
| `amount` | numeric | Yakuniy narx |
| `commission_amount` | numeric | Platforma ulushi |
| `master_amount` | numeric | Ustaga tegadigan sof summa |
| `client_confirmed` | bool | Client ish tugadi tasdig'i |
| `master_confirmed` | bool | Master ish tugadi tasdig'i |
| `admin_approved` | bool | Nizo/dispute yechimidan keyin |
| `is_dispute` | bool | Nizo bayrog'i |
| `created_at` / `updated_at` | timestamptz | |

**Kelajakda qo'shiladigan ustunlar** (agar kerak bo'lsa migration bilan):
- `accepted_at`, `enroute_at`, `started_at`, `completed_at`, `cancelled_at`, `cancel_reason`
- `client_lat/lng`, `master_lat/lng` (LiveTracker uchun)
- `promo_code_id`, `discount`, `bonus_used`
- `is_emergency bool default false`

### 2.6 `messages` (chat)
`sender_id`, `receiver_id`, `order_id NULL`, `content`, `is_read bool default false`, `created_at`.
**Realtime:** `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;` bajarilgan.
**Rasm yuborish:** `content` maydoniga `storage://chat-media/<uuid>.jpg` URL yozish (yoki keyingi bosqichda `attachment_url text`, `attachment_type text` ustunlarini qo'shish). Bucket kerak bo'lsa `chat-media` (auth read).
**Read status:** `is_read` — receiver ochganda UPDATE.

### 2.7 `notifications`
`user_id`, `sender_id`, `title`, `message`, `type` (`info`|`order_new`|`order_accepted`|`emergency_order`|`verification_approved`|`verification_rejected`|`broadcast`|`payment`|`review`), `related_order_id`, `is_read`, `claimed_by`, `claimed_at`.
**Kanal:** DB notifications (real-time bell) + tanlab **SMS** (Eskiz.uz) + kelajakda **Web Push** (VAPID). Push hozircha yo'q.

### 2.8 `transactions`
`user_id`, `order_id`, `type` (`payment`|`commission`|`payout`|`refund`|`bonus`|`cashback`), `amount`, `status` (`pending`|`success`|`failed`), `provider` (`click`|`payme`|`cash`|`internal`), `provider_ref`.

### 2.9 `subscriptions` va `subscription_plans`
`subscriptions`: `user_id UNIQUE`, `tier ('free'|'basic'|'standard'|'pro'|'premium'|'vip')`, `is_trial`, `trial_ends_at`, `expires_at`, `billing_period`, `audience`.
`subscription_plans`: admin tomonidan sozlanadigan tarif katalogi (narx, davomiylik, cheklovlar, badge).

### 2.10 Qolganlar
`reviews` (1..5 CHECK, unique per order+client), `favorite_masters`, `saved_addresses`, `complaints`, `promo_codes` + `promo_redemptions`, `withdraw_requests`, `master_availability`, `platform_settings` (masalan `commission_percent`), `broadcasts`.

---

## 3. RLS qisqa ma'lumot

- `orders`: client — o'z buyurtmalari; master — `master_id = auth.uid()` yoki `status='pending'` + emergency ko'radi; admin ALL.
- `messages`: `sender_id = auth.uid() OR receiver_id = auth.uid()`.
- `reviews`: SELECT hamma; INSERT — client faqat o'z tugagan orderi uchun.
- `transactions`: SELECT egasi; INSERT — service_role/edge function.
- `verification_requests`: usta o'zi; admin ALL.
- `user_roles`: SELECT o'zi; write faqat service_role.

---

## 4. Order Flow (state machine) — **eng muhim**

### 4.1 Statuslar
```
pending   → buyurtma yaratildi, master tanlanmagan
matching  → AI/emergency broadcast yuborildi (ixtiyoriy, hozir 'pending' ichida)
accepted  → master qabul qildi (master_id to'ldi)
enroute   → master yo'lda (LiveTracker start)
in_progress → ish boshlandi
completed → master ish tugadi deb belgiladi
confirmed → client tasdiqladi → to'lov triggeri
paid      → to'lov muvaffaqiyatli o'tdi (commission ajratildi)
reviewed  → client review qoldirdi
cancelled → bekor qilindi (client yoki master yoki timeout)
disputed  → nizo, admin qaraydi
```

### 4.2 To'liq oqim

```
1)  Client Order yaratadi (status='pending')
        └─ INSERT orders + INSERT notifications (type='order_new') mos ustalarga
2)  AI mos ustalarni topadi  (ai-match edge function)
        └─ Top 10 usta ID qaytaradi (score bo'yicha § 5)
3)  Top 10 ustaga notification
        └─ type='emergency_order' bo'lsa hammaga; oddiy bo'lsa top 10ga
4)  1-chi accept qilgan oladi  (claim_emergency_order RPC — row lock)
        └─ orders.master_id = _master, status='accepted', accepted_at=now()
        └─ boshqa notification'lar 'claimed' bo'ladi (claimed_by, claimed_at)
        └─ client'ga notification (type='order_accepted')
5)  Master yo'lga chiqdi   → status='enroute',  enroute_at=now()
        └─ LiveTracker: master_lat/lng har 10s Realtime broadcast
6)  Ish boshlandi          → status='in_progress', started_at=now()
7)  Ish tugadi (master)    → status='completed', master_confirmed=true, completed_at=now()
        └─ Client'ga notification "Ishni tasdiqlang"
8)  Client tasdiqlaydi     → status='confirmed', client_confirmed=true
        └─ Trigger: to'lov (§6) + commission ajratish
9)  To'lov
        └─ cash: transactions(type='payment', status='success', provider='cash')
        └─ click/payme: process-payment edge function → callback → status='paid'
        └─ commission_amount = amount * get_commission_percent()/100
        └─ master_amount    = amount - commission_amount
        └─ master_profiles.balance += master_amount
10) Review     → INSERT reviews (rating 1..5)
        └─ Trigger: master_profiles.rating qayta hisoblanadi
11) Cashback   → trg_award_cashback_on_complete → profiles.bonus_balance += 1%
```

### 4.3 Ruxsat etilgan o'tishlar
```
pending → accepted | cancelled
accepted → enroute | cancelled
enroute → in_progress | cancelled
in_progress → completed | disputed
completed → confirmed | disputed
confirmed → paid
paid → reviewed
* → disputed (client yoki master shikoyat qildi)
disputed → confirmed | cancelled (admin qaror qiladi, admin_approved=true)
```
Har bir o'tish RPC orqali (masalan `order_advance(_id, _to text)`) yoki tekshiruvchi trigger orqali cheklanadi. Client `pending → cancelled` va `completed → confirmed` qila oladi; master `accepted → enroute → in_progress → completed`; admin — istalgan holat.

### 4.4 Timeout va bekor qilish
- `pending` 15 daqiqada hech kim accept qilmasa — Edge Function cron (`order-timeout`) `status='cancelled'`, sabab `no_master`.
- `enroute` 60 daqiqada `in_progress` bo'lmasa — client'ga eslatma.
- `completed` 48 soatda tasdiqlanmasa — avtomatik `confirmed` (yoki dispute uchun ochiq qoldiriladi — biznes qarori).

---

## 5. AI Match algoritmi

Edge function `ai-match` (Lovable AI Gateway). Alohida DB funksiyasi `master_match_score(_master_id, _client_lat, _client_lng)` mavjud.

### Score formulasi (0..200)
```
score = rating * 10                                  -- 0..50
      + LEAST(jobs_completed, 100) * 0.3             -- 0..30
      + tier_boost                                    -- free 0, pro 15, premium 30
      + distance_score                                -- 0..50 (yaqinroq — yuqoriroq)
      + verification_bonus                           -- verified +10
      + response_time_bonus                          -- <5min +10, <15min +5
      + price_fit_bonus                              -- diapazonga tushsa +10
      - blocked_penalty                              -- is_blocked bo'lsa -1000
```

**Distance:** Haversine (yoki soddalashtirilgan) formulasi, `service_radius_km` dan tashqarida bo'lsa `score = 0`.

**Rating:** `master_profiles.rating` (reviewslar avg).

**Verification:** `is_verified = true` → +10, `verification_tier='premium'` → +15.

**Experience:** `experience_years` → `LEAST(experience, 20) * 0.5`.

**Price:** `services.price` client so'ragan `budget_range` ichida bo'lsa +10.

**Response time:** oxirgi 30 kunda o'rtacha accept vaqti (`accepted_at - created_at`); tez usta yuqori chiqadi.

**Chiqish:** yuqori 10 ta `master_id` massivi + score. Top-1 emergency uchun; qolganlar oddiy accept uchun.

**Emergency**: `claim_emergency_order(_order_id)` — birinchi accept qilgan oladi (row-level lock `FOR UPDATE`).

---

## 6. Payments va commission

### 6.1 Oqim
```
client tasdiqlagach → payment_method bo'yicha yo'l:
  cash    → offline; commission master balansidan hisoblab yechiladi
  click   → process-payment (verify_jwt=false) → provider callback → transactions.status='success'
  payme   → xuddi shunday
  bonus   → use_bonus_balance RPC
```

### 6.2 Commission
- Foiz: `get_commission_percent()` → `platform_settings.commission_percent` (default 10%).
- Hisoblash `paid` bo'lganda (yoki cashda `confirmed` bo'lganda):
  ```
  commission = round(amount * pct / 100)
  master_amount = amount - commission
  ```
- Transactions'ga 2 ta yozuv: `type='payment'` (client -amount), `type='commission'` (platform +commission), `type='payout'` (master +master_amount).
- `withdraw_requests`: master `withdrawable_balance` ni qaytarib olishni so'raydi; admin tasdiqlaydi → provider'ga o'tkazma → status='paid'.

### 6.3 Refund
Dispute'da admin `admin_refund_order(order_id)` RPC (kelajakda) chaqiradi — transactions `type='refund'`, master balansidan yechiladi.

---

## 7. Subscriptions — Free / Pro / Premium

| Tier | Kim uchun | Narx (misol) | Nima beradi |
|---|---|---|---|
| **free** | Client + Master | 0 | Master: 3 ta service, order accept **YO'Q**. Client: hamma asosiy funksiya. |
| **basic/standard** | Master | past | Order accept qilish yoqiladi (`master_can_accept_orders = true`) |
| **pro** | Master | o'rtacha | Cheksiz service, AI match +15 boost, "Pro" badge, birinchi 30 kun trial |
| **premium** | Master | yuqori | Pro + AI match +30 boost, top listing, verified priority, emergency birinchi bo'lib ko'radi |
| **vip** | Master | eng yuqori | Premium + shaxsiy admin qo'llab-quvvatlash, kengaytirilgan analytics |

### Trial
- Master: 30 kun `pro` trial (`is_trial=true`, `trial_ends_at`).
- Client: 7 kun `pro` trial.
- Tugagach: `subscriptions.tier='free'`, `expires_at=now()` — Edge cron `subscription-expire` kunlik ishlaydi.
- Trial tugaganidan keyin master **yangi order accept qila olmaydi** toki `basic+` sotib olmaguncha (`master_can_accept_orders`).

### Aktivatsiya
- `activate_subscription(_tier, _months)` RPC — to'lov o'tgach chaqiriladi.
- Provider callback → `activate_subscription` → `expires_at = now() + N months`.

---

## 8. Notifications — 3 kanal

| Kanal | Qachon | Qanday |
|---|---|---|
| **DB (Bell)** | Har doim | INSERT `notifications` → Realtime `notifications` channel → NavBar bell |
| **SMS** | Muhim voqealar (accept, tasdiq, to'lov) | `send-sms` edge (Eskiz.uz), `send_sms=true` argumenti bilan |
| **Web Push** | KELAJAKDA (v2) | VAPID keys + `push_subscriptions` jadvali |

Broadcast: `admin_send_broadcast(audience, title, message, send_sms)` — barcha (yoki `clients`/`masters`) foydalanuvchilarga bir vaqtda.

---

## 9. Realtime kanallari

Publication'ga qo'shilgan:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```
Frontend `useEffect` ichida `.channel(...).on('postgres_changes', ...).subscribe()` va `return () => supabase.removeChannel(channel)`. RLS Realtime'da ham qo'llanadi — subscriber faqat ko'ra oladigan qatorlarni oladi.

LiveTracker: `supabase.channel('order:'+id).on('broadcast', {event:'location'}, ...)` — master koordinatasini yuboradi (DBga yozmasdan), client oladi.

---

## 10. RPC kontrakti (qisqa jadval)

| RPC | Kim | Chiqish |
|---|---|---|
| `has_role(uid, role)` | ichki | bool |
| `get_my_profile / get_my_master_profile / get_my_subscription_status / get_my_master_balance` | egasi | row/jsonb |
| `admin_list_profiles / admin_get_profiles / admin_get_master_profile / admin_get_master_balances / admin_recent_messages / admin_delete_user / admin_send_broadcast / admin_approve_verification` | admin | ... |
| `claim_emergency_order(order_id)` | master | jsonb `{ok, order_id, master_id}` |
| `apply_promo_code / redeem_promo_code / use_bonus_balance` | auth | jsonb |
| `activate_subscription(tier, months)` | auth (to'lovdan keyin) | jsonb |
| `award_cashback(order_id)` | trigger | void |
| `master_can_add_service / master_can_accept_orders / master_match_score / get_commission_percent` | ichki | ... |

Har bir admin RPC birinchi qatori:
```sql
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
```

---

## 11. Edge Functions

| Funksiya | verify_jwt | Vazifasi | Secrets |
|---|---|---|---|
| `ai-estimate` | false | Muammo matnidan narx oralig'i | `LOVABLE_API_KEY` |
| `ai-match` | true | Top 10 usta ID + score | `LOVABLE_API_KEY` |
| `send-sms` | false | Eskiz.uz SMS | `ESKIZ_EMAIL/PASSWORD` |
| `process-payment` | false | Click/Payme callback | provider |
| `order-timeout` (v2) | cron | 15 daq accept bo'lmasa cancel | — |
| `subscription-expire` (v2) | cron | Kunlik trial/subscription tugatish | — |

---

## 12. Storage bucketlari

| Bucket | Public | Foydalanish |
|---|---|---|
| `avatars` | ✅ | Foydalanuvchi rasmi |
| `portfolio` | ✅ | Usta ish namunalari |
| `verification-docs` | ❌ | Passport, selfie (owner + admin signed URL) |
| `chat-media` (v2) | ❌ | Chat rasm/fayllari |

---

## 13. Xavfsizlik checklist (PR)

- [ ] Yangi `public` jadvalga GRANT + RLS + policy (§ 0).
- [ ] Sensitiv ustunga `REVOKE SELECT (col)` + RPC.
- [ ] `auth`/`storage`/`realtime`/`supabase_functions`/`vault` — tegilmagan.
- [ ] `client.ts` / `types.ts` / `.env` — o'zgarmagan.
- [ ] Rollar faqat `user_roles`da; tekshiruv `has_role`.
- [ ] Har bir RPC `SECURITY DEFINER SET search_path = public` + ichida rol/uid tekshiruvi.
- [ ] `updated_at` trigger o'rnatilgan.
- [ ] Realtime'ga qo'shilgan jadvalda RLS yoqilgan.
- [ ] `supabase--linter` yashil.

---

## 14. Yangi jadval shabloni

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

CREATE POLICY "own read"  ON public.example FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "own write" ON public.example FOR ALL    TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "admin all" ON public.example FOR ALL    TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_example_updated
  BEFORE UPDATE ON public.example
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 15. Definition of Done (backend)

1. Barcha jadval § 0 tartibida (GRANT + RLS + trigger).
2. Sensitiv ustunlar — faqat egasi/admin RPC orqali.
3. Rollar faqat `user_roles`; `has_role` orqali tekshiriladi.
4. `orders` state machine (§ 4) to'liq ishlaydi — har o'tish ruxsat tekshiruvi bilan.
5. AI match (§ 5) top 10 usta qaytaradi, emergency first-accept-wins ishlaydi (`claim_emergency_order`).
6. Payment flow (§ 6): commission avtomatik ajratiladi, `transactions` yozuvlari to'g'ri, `withdraw_requests` admin approve orqali.
7. Subscriptions (§ 7): trial avtomatik, tugagach master accept qila olmaydi; `activate_subscription` to'lovdan keyin ishlaydi.
8. Notifications 3 kanal (§ 8) — DB Realtime bell + tanlab SMS; admin broadcast ishlaydi.
9. Realtime (§ 9) — `messages`, `notifications`, `orders` publication'da; RLS orqali filtrlangan.
10. `supabase--linter` va `supabase--db_health` yashil; loyihada demo/soxta data yo'q; barcha migration idempotent.
