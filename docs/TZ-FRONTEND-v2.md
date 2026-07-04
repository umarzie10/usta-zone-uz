# T/Z — Frontend (yangi qism)

## 1. Admin Kategoriyalar (`src/components/AdminCategories.tsx`)

- **Tasdiqlash modal**: o'chirish `AlertDialog` (shadcn) orqali. `window.confirm` ishlatilmaydi.
- **Toastlar**: `sonner` — `toast.success` / `toast.error`. Har bir CRUD amali natijasi ko'rsatiladi.
- **Sort**: har bir satrda ArrowUp/ArrowDown tugmalari. Bosilganda qo'shni yozuv bilan `order_num` almashadi (`swapOrder`), optimistic local update.
- Yangi yozuv qo'shilganda `order_num = max(siblings.order_num) + 1`.
- Dialog `dialogOpen` state bilan boshqariladi (asosiy kategoriya qo'shishda ochilmaslik bug'i tuzatilgan).

## 2. Find Master subkategoriya filteri (`src/pages/FindMaster.tsx`)

- Subkategoriyalar endi **DB'dan** olinadi (`categories` `parent_id` bo'yicha), avvalgi hard-coded taxonomy o'rniga. Admin yangilashi darhol filterda ko'rinadi.
- Select `value = subcategory_id`. Filtrlash: master `category_ids` ichida shu id bor bo'lsa yoki `skills` da subkategoriya nomi topilsa mos keladi.
- Asosiy kategoriya `all` bo'lsa subkategoriya dropdown o'chiriladi.
- Ko'p tilli nom: `catName(c)` — `lang` ga qarab `name_ru/name_en/name_uz`.

## 3. Testlar (`src/test/pageTransition.test.tsx`)

- Layout `<main>` `page-enter` klassini olishini tekshiradi.
- `pathname` o'zgarganda `key` orqali qayta mount bo'lishini (animatsiya restart) tekshiradi.
- `prefers-reduced-motion: reduce` mediasini `window.matchMedia` orqali detektsiya qilishni tekshiradi.
- Ishga tushirish: `bunx vitest run src/test/pageTransition.test.tsx`.
- `src/test/setup.ts` ga `IntersectionObserver` stub qo'shilgan (jsdom da yo'q).

## Definition of Done
- Admin panelda kategoriya/sub qo'shilganda AlertDialog tasdiqi + toast.
- Ustki/pastki strelka bilan tartib o'zgaradi va saqlanadi.
- Find Master'da subkategoriya select DB dan to'ldiriladi va filter natijaga ta'sir qiladi.
- `vitest run` yashil.
