# T/Z — Backend (yangi qism)

## 1. `categories.order_num` — tartib

- Ustun mavjud (`int`). Frontend ArrowUp/ArrowDown bosilganda ikkita `UPDATE categories SET order_num = ? WHERE id = ?` yuboradi (qo'shni bilan almashish).
- RLS: `Admins can manage categories` (`ALL` + `has_role('admin')`) — o'zgartirish uchun yetarli.
- GRANT: `SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated` (mavjud).
- **Tavsiya**: kelajakda ommaviy tartib almashish uchun `admin_reorder_categories(_ids uuid[])` RPC yozish mumkin — hozircha kerak emas.

## 2. `categories` daraxti Find Master uchun

- Sub-lar `parent_id` orqali olinadi. Hech qanday yangi jadval yoki view kerak emas.
- `master_profiles.category_ids uuid[]` — endi ustalar **ham asosiy, ham subkategoriya** id'sini shu massivga yozadi. Registratsiya/kabinet formasi allaqachon shunday saqlaydi.
- Ixtiyoriy indeks (katta hajmga o'sganda):
  ```sql
  CREATE INDEX IF NOT EXISTS idx_master_profiles_category_ids
    ON public.master_profiles USING GIN (category_ids);
  ```

## 3. O'chirish oqimi
- `ON DELETE CASCADE` (parent_id) mavjud → asosiyni o'chirsa sublar ham o'chadi.
- Frontend AlertDialog orqali oldindan ogohlantirish beradi; backend'da qo'shimcha o'zgarish shart emas.

## Definition of Done
- Admin `order_num` ni UI orqali o'zgartira olishi (RLS'ga tegmasdan).
- `categories` GRANT'lari o'z joyida.
- (ixtiyoriy) `category_ids` GIN indeksi ishlab chiqarish yukiga qarab qo'shiladi.
