// UstaZone — yangi kategoriya iyerarxiyasi
// Asosiy → Subkategoriya → Xizmat turi

export interface SubCategory {
  slug: string;
  name: string;
  services?: string[];
}

export interface MainCategory {
  slug: string;
  emoji: string;
  name: string;
  color: string;
  subs: SubCategory[];
}

export const categoryTree: MainCategory[] = [
  {
    slug: 'uy-tamir',
    emoji: '🏠',
    name: "Uy va Ta'mirlash",
    color: '#2563eb',
    subs: [
      { slug: 'elektrik', name: 'Elektrik', services: ['Rozetka', 'Lyustra', 'Avtomat', 'Simlash'] },
      { slug: 'santexnik', name: 'Santexnik', services: ['Quvur', 'Kran', 'Unitaz', 'Bo\'g\'ilish'] },
      { slug: 'konditsioner', name: 'Konditsioner', services: ['O\'rnatish', 'Toza­lash', 'Ta\'mir'] },
      { slug: 'remont', name: "Remont ustalari" },
      { slug: 'kafel', name: 'Kafel / Laminat' },
      { slug: 'boyoq', name: "Bo'yoqchilar" },
      { slug: 'shift', name: 'Shift ustalari' },
    ],
  },
  {
    slug: 'avto',
    emoji: '🚗',
    name: 'Avto Xizmatlar',
    color: '#dc2626',
    subs: [
      { slug: 'avto-elektrik', name: 'Avto elektrik' },
      { slug: 'motor', name: 'Motor ustasi' },
      { slug: 'diagnostika', name: 'Diagnostika' },
      { slug: 'moy', name: 'Moy almashtirish' },
      { slug: 'evakuator', name: 'Evakuator' },
      { slug: 'gaz', name: "Gaz o'rnatish" },
      { slug: 'tuning', name: 'Tuning' },
    ],
  },
  {
    slug: 'it',
    emoji: '💻',
    name: 'Texnika va IT',
    color: '#7c3aed',
    subs: [
      { slug: 'kompyuter', name: 'Kompyuter ustasi' },
      { slug: 'noutbuk', name: "Noutbuk ta'miri" },
      { slug: 'telefon', name: "Telefon ta'miri" },
      { slug: 'printer', name: 'Printer' },
      { slug: 'wifi', name: 'Wi-Fi / Internet' },
      { slug: 'kamera', name: "Kamera o'rnatish" },
    ],
  },
  {
    slug: 'tozalash',
    emoji: '🧹',
    name: 'Tozalash Xizmatlari',
    color: '#0891b2',
    subs: [
      { slug: 'uy-tozalash', name: 'Uy tozalash' },
      { slug: 'ofis-tozalash', name: 'Ofis tozalash' },
      { slug: 'gilam', name: 'Gilam yuvish' },
      { slug: 'kimyoviy', name: 'Kimyoviy tozalash' },
      { slug: 'dezinfeksiya', name: 'Dezinfeksiya' },
    ],
  },
  {
    slug: 'dizayn',
    emoji: '🎨',
    name: 'Dizayn va Media',
    color: '#db2777',
    subs: [
      { slug: 'grafik', name: 'Grafik dizayn' },
      { slug: 'logo', name: 'Logo dizayn' },
      { slug: 'video', name: 'Video montaj' },
      { slug: 'smm', name: 'SMM' },
      { slug: 'fotograf', name: 'Fotograf' },
      { slug: 'web', name: 'Web sayt' },
    ],
  },
  {
    slug: 'yetkazib',
    emoji: '📦',
    name: "Yetkazib Berish va Ko'chirish",
    color: '#ea580c',
    subs: [
      { slug: 'yuk', name: 'Yuk tashish' },
      { slug: 'gruzchik', name: 'Gruzchik' },
      { slug: 'kuryer', name: 'Kuryer' },
      { slug: 'mebel', name: "Mebel ko'chirish" },
    ],
  },
  {
    slug: 'talim',
    emoji: '👨‍🏫',
    name: "Ta'lim va Kurslar",
    color: '#16a34a',
    subs: [
      { slug: 'ingliz', name: 'Ingliz tili' },
      { slug: 'matematika', name: 'Matematika' },
      { slug: 'it-kurs', name: 'IT kurs' },
      { slug: 'gitara', name: 'Gitara' },
      { slug: 'fitness', name: 'Fitness trener' },
    ],
  },
];

export const allSubcategories = categoryTree.flatMap(c =>
  c.subs.map(s => ({ ...s, parentSlug: c.slug, parentName: c.name, color: c.color, emoji: c.emoji }))
);
