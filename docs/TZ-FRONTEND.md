# Texnik topshiriq — Frontend (UstaZone)

**Stack:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui + React Router + Supabase JS.

Barcha UI matnlari uzbek tilida. Dizayn tili: chuqur ko'k asosli, Inter font, mobile-first, `overflow-x: hidden`.

---

## 1. Kategoriya va subkategoriya boshqaruvi (Admin)

**Fayl:** `src/components/AdminCategories.tsx` (Admin paneldagi "Kategoriyalar" tab).

### Talablar
1. Kategoriyalar 2 darajali daraxt: **Asosiy kategoriya → Subkategoriya**. Ma'lumot bazasida bitta `categories` jadvali, `parent_id` orqali bog'lanadi (`parent_id IS NULL` → asosiy).
2. Ro'yxat: har bir asosiy kategoriya yonida chevron (ochish/yopish), rang, nom, subkategoriya soni.
3. Amallar tugmalari:
   - `+ Yangi kategoriya` — asosiy qo'shish.
   - `+ Sub` (satr ichida) — shu asosiyga subkategoriya qo'shish.
   - Qalam ikonasi — tahrirlash (asosiy va sub uchun).
   - Savat ikonasi — o'chirish (asosiy o'chirilsa, `ON DELETE CASCADE` orqali sublar ham).
4. Modal forma maydonlari: `name_uz` (majburiy), `name_ru`, `name_en`, `icon` (lucide slug), `color` (hex). RU/EN bo'sh bo'lsa UZ qiymati qo'yiladi.
5. Yopish: overlay bosilganda yoki X tugmasi.
6. Xabarlar: `useApp().showNotification('success'|'error', text)` orqali.

### Muhim: dialog holati
Modal alohida `dialogOpen: boolean` state bilan boshqariladi (avvalgi bug: `null` newParentId asosiy kategoriya qo'shilganda dialog ochilmasdi). `openCreate`/`openEdit` → `setDialogOpen(true)`, `closeDialog` → hammasini reset.

### Master ro'yxatdan o'tishida
`src/pages/RegisterMaster.tsx` va `src/components/MasterSettingsForm.tsx`:
- Asosiy kategoriyalar chipp shaklida.
- Tanlangan asosiy kategoriya subkategoriyalari ochiladi.
- Har bir tanlangan subkategoriya uchun `SubcategoryPricing` orqali: **boshlang'ich narx**, **kelishilgan narx** (bool), **tajriba yili**, **portfolio rasmlari**.
- Kabinet ichida ham xuddi shu forma bilan tahrir qilish mumkin.

---

## 2. Sahifalar orasidagi silliq animatsiyalar

**Fayl:** `src/components/Layout.tsx`, `src/index.css`.

- `<main key={pathname} className="... page-enter">` — har bir route almashganda `.page-enter` qayta ishga tushadi.
- `.page-enter` klassi: `animation: pageEnter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;` (fade + slight upward slide).
- Kartochka/heading ko'rinishida `useScrollReveal` hook — `.reveal` klassini avtomat qo'yadi, viewport'ga kirganda `.in-view` qo'shiladi.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` blokida barcha animation/transition davomiyligi 0.001ms ga tushiriladi; `.reveal*` elementlari darhol ko'rinadi. Kod: `src/index.css` oxirida.

Yangi sahifa qo'shganda hech nima qilish shart emas — `Layout` orqali o'ralsa animatsiya avtomat ishlaydi.

### Boshqa hover/mikro-animatsiyalar
- `.hover-lift`, `.hover-scale`, `.story-link`, `.animate-fade-in`, `.animate-fade-in-up`, `.animate-bounce-in`, `.animate-float`, `.animate-shimmer` — tayyor utility klasslar `tailwind.config.ts` va `index.css` da.

---

## 3. Responsive qoidalar
- Barcha sahifa `overflow-x-hidden`.
- Tablet (768–1023px) da Navbar hamburger menyuga o'tadi (`hidden lg:flex`).
- Matnlar `truncate` yoki `line-clamp-*` bilan cheklanadi. Kartochkalar `min-w-0` bilan flex ichida ezilmaydi.
- Formalar mobile'da bir ustun, `sm:` dan boshlab 2 ustun grid.

---

## 4. Supabase ma'lumotlari
- `import { supabase } from "@/integrations/supabase/client"` — hech qachon tahrirlamaymiz.
- Kategoriyalar: `supabase.from('categories').select('*').order('order_num').order('name_uz')`.
- Master profil (o'zi): `rpc('get_my_master_profile')`.
- Adminda profil ro'yxati: `rpc('admin_list_profiles')`.

---

## 5. Definition of Done
- Admin yangi asosiy kategoriya va subkategoriya qo'sha oladi, tahrirlaydi, o'chiradi.
- Master ro'yxatda/kabinetda subkategoriya, narx, radius, ish vaqti, hujjatlarni tahrirlay oladi.
- Sahifa almashuvida silliq fade+slide animatsiya.
- `prefers-reduced-motion: reduce` yoqilgan qurilmalarda animatsiya sekundning mingdan bir qismiga tushadi.
- Barcha ekranlarda (320px dan boshlab) matn ustma-ust chiqmaydi.
