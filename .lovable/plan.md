## Obuna tizimini to'liq yangilash

### 1. Database o'zgarishlari (migration)

**Subscription tier enumlarini kengaytirish:**
- Master tariflari: `free`, `basic`, `pro`, `premium` (premium = VIP)
- User tariflari uchun yangi enum: `client_tier` (`free`, `pro`, `vip`)

**`subscriptions` jadvalini yangilash:**
- `trial_ends_at TIMESTAMPTZ` — bepul sinov muddati tugashi
- `is_trial BOOLEAN DEFAULT false`
- `billing_period TEXT` — `1m`, `3m`, `6m`, `12m`
- `audience TEXT DEFAULT 'master'` — `master` yoki `client`

**Trigger yangilash (`handle_new_user`):**
- Yangi usta ro'yxatdan o'tganda: `tier='pro'`, `is_trial=true`, `trial_ends_at = now() + 30 days`
- Yangi client ro'yxatdan o'tganda: `tier='pro'` (client_tier), `is_trial=true`, `trial_ends_at = now() + 7 days`

**Yangi RPC funksiyalar:**
- `get_my_subscription_status()` — joriy tier, kunlar qoldi, trial faol/yo'q, expired/yo'q
- `master_can_accept_orders(_user_id)` — agar trial yoki obuna faol bo'lsa `true`
- `activate_subscription(_tier, _period_months)` — narxni hisoblab, expires_at qo'yib upsert

**Narxlar jadvali (`subscription_plans`):**
- Hardcoded narx ro'yxati (kod tomonda), DB da `platform_settings` ga JSON yozish

### 2. Backend logikasi

**Order qabul qilishni cheklash:**
- `accept_order` RPC ga `master_can_accept_orders` chekini qo'shish
- Trial tugagan + obunasiz ustalar buyurtma qabul qila olmaydi

**Master profilini yashirish:**
- `master_profiles` ga ko'rinish flagi kerak emas — `master_can_accept_orders=false` bo'lsa, frontend list query da `is_active=false` ko'rinadi
- Yoki yangi view `public_master_profiles` qaysiki subscription faol bo'lganlarni qaytaradi
- Yondashuv: `MasterProfile.tsx` da agar usta o'zi bo'lmasa va obunasi tugagan bo'lsa — "Bu usta hozir mavjud emas" sahifasi ko'rsatiladi
- `FindMaster`/`TopMasters` query lariga obuna faolligi filtri

### 3. Frontend o'zgarishlar

**`Subscription.tsx` to'liq qayta yozish:**
- Tab: "Usta tariflari" / "Mijoz tariflari" (auth role ga qarab default)
- Har tarif kartochkasi: BASIC/PRO/VIP narx + xususiyatlar
- Davr tanlovi: 1/3/6/12 oy (chegirma badge)
- Trial holatini ko'rsatish

**Master Dashboard:**
- Tepada countdown banner: `⏳ Bepul PRO davri tugashiga N kun qoldi` (trial paytida)
- Trial tugagandan keyin: butun dashboard ustidan overlay "Obunani xarid qiling" CTA
- Profilning ko'pgina sahifalari bloklanadi

**Client Dashboard:**
- Trial banner: `⏳ PRO sinov muddati — 7 kun qoldi`
- PRO/VIP badge profilga

**Yangi komponent: `SubscriptionGuard.tsx`**
- Master sahifalarini o'rab, expired holatda block ekrani ko'rsatadi
- `<SubscriptionGuard>` MasterDashboard, profile edit, orders accept tugmasi atrofida

**Yangi komponent: `TrialCountdown.tsx`**
- Har kun qancha qolganini ko'rsatadi

**Master kartochkalarida badge:**
- PRO/VIP/Premium badge (allaqachon qisman bor — kengaytirish)

### 4. Faylda

**Yangi/o'zgartirilgan fayllar:**
- `supabase/migrations/<new>.sql` — enumlar, trigger, RPClar
- `src/pages/Subscription.tsx` — yangi UI (tablar, davr, BASIC/PRO/VIP)
- `src/components/SubscriptionGuard.tsx` — yangi
- `src/components/TrialCountdown.tsx` — yangi
- `src/pages/MasterDashboard.tsx` — countdown + guard
- `src/pages/ClientDashboard.tsx` — trial banner
- `src/pages/MasterProfile.tsx` — obunasiz ustaga "mavjud emas" sahifa
- `src/pages/FindMaster.tsx`, `Masters.tsx`, `TopMasters.tsx` — filtri
- `src/lib/subscriptionPlans.ts` — yangi (narx + xususiyatlar markaziy joyda)

### 5. Diqqat qaratilmaydigan narsalar
- Haqiqiy to'lov integratsiyasi (Click/Payme) shu turda mavjud — narxni o'zgartirish kifoya
- Cashback foiz (2%/5%) yangilash — keyingi bosqichda
- Lead paketlari, reklama bannerlari — alohida feature, kiritilmaydi

### Tartib
1. Migration (enum + trigger + RPC)
2. `subscriptionPlans.ts` markaziy konfiguratsiya
3. `Subscription.tsx` qayta yozish
4. `SubscriptionGuard` + `TrialCountdown`
5. Dashboardlar va Master profili
6. Ro'yxat sahifalari filtri

Tasdiqlasangiz boshlayman.