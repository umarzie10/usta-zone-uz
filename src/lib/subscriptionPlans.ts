// Centralized subscription plan configuration

export type MasterTier = 'free' | 'basic' | 'pro' | 'premium';
export type ClientTier = 'free' | 'pro' | 'vip';
export type AnyTier = MasterTier | ClientTier | 'standard' | 'vip';

export type BillingMonths = 1 | 3 | 6 | 12;

export interface PlanPriceMap {
  1: number;
  3: number;
  6: number;
  12: number;
}

export interface MasterPlan {
  id: MasterTier;
  name: string;
  icon: string;
  badge: string;
  popular?: boolean;
  prices: PlanPriceMap; // so'm
  features: string[];
}

export interface ClientPlan {
  id: ClientTier;
  name: string;
  icon: string;
  badge: string;
  popular?: boolean;
  prices: PlanPriceMap; // so'm; 0 = free
  features: string[];
}

export const MASTER_PLANS: MasterPlan[] = [
  {
    id: 'basic',
    name: 'BASIC',
    icon: '🟢',
    badge: 'Yangi boshlovchilar',
    prices: { 1: 19000, 3: 54000, 6: 99000, 12: 189000 },
    features: [
      'Profil yaratish',
      "5 tagacha xizmat qo'shish",
      'Buyurtmalarni qabul qilish',
      'Mijoz bilan chat',
      'Reyting va sharhlar',
      'Portfolio (10 tagacha rasm)',
      'Asosiy statistika',
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    icon: '⭐',
    badge: 'Faol ustalar',
    popular: true,
    prices: { 1: 39000, 3: 109000, 6: 209000, 12: 399000 },
    features: [
      'BASIC dagi hammasi',
      'Cheksiz xizmatlar',
      'Cheksiz portfolio',
      'Qidiruvda yuqoriroq',
      'Batafsil statistika',
      'Tasdiqlangan usta belgisi',
      'Telegram bildirishnomalari',
      'Tezkor support',
    ],
  },
  {
    id: 'premium',
    name: 'VIP',
    icon: '👑',
    badge: 'Professional ustalar',
    prices: { 1: 59000, 3: 169000, 6: 319000, 12: 599000 },
    features: [
      'PRO dagi hammasi',
      'Eng yuqori prioritet',
      'Premium badge',
      "Tavsiya etilgan ustalar bo'limi",
      'AI yordamchi',
      'Reklama chegirmalari',
      'Prioritet buyurtmalar',
      'Shaxsiy menejer support',
    ],
  },
];

export const CLIENT_PLANS: ClientPlan[] = [
  {
    id: 'free',
    name: 'FREE',
    icon: '🆓',
    badge: 'Boshlovchilar uchun',
    prices: { 1: 0, 3: 0, 6: 0, 12: 0 },
    features: [
      'Usta qidirish',
      'Buyurtma yaratish',
      'Chat',
      'Sharh qoldirish',
      "Sevimlilar ro'yxati",
      'Buyurtma tarixi',
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    icon: '⭐',
    badge: 'Faol mijozlar',
    popular: true,
    prices: { 1: 19000, 3: 54000, 6: 99000, 12: 189000 },
    features: [
      'FREE dagi hammasi',
      'Buyurtma ustalarga yuqoriroq',
      'Prioritet chat',
      '2% cashback',
      'Maxsus aksiyalar',
      'PRO badge',
      'Tezkor support',
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    icon: '👑',
    badge: 'Premium mijozlar',
    prices: { 1: 39000, 3: 109000, 6: 209000, 12: 399000 },
    features: [
      'PRO dagi hammasi',
      '5% cashback',
      'VIP badge',
      'Premium support',
      'Prioritet buyurtmalar',
      'Maxsus chegirmalar',
      'Yangi funksiyalarga erta kirish',
      'AI tavsiyalar',
    ],
  },
];

export const TIER_BADGE: Record<string, { label: string; color: string; icon: string }> = {
  free: { label: 'Free', color: 'bg-muted text-muted-foreground', icon: '🆓' },
  basic: { label: 'Basic', color: 'bg-emerald-500/15 text-emerald-600', icon: '🟢' },
  standard: { label: 'Standard', color: 'bg-primary/15 text-primary', icon: '⭐' },
  pro: { label: 'Pro', color: 'bg-primary/15 text-primary', icon: '⭐' },
  premium: { label: 'VIP', color: 'bg-amber-500/15 text-amber-600', icon: '👑' },
  vip: { label: 'VIP', color: 'bg-amber-500/15 text-amber-600', icon: '👑' },
};

export const BILLING_OPTIONS: { months: BillingMonths; label: string; discount?: string }[] = [
  { months: 1, label: '1 oy' },
  { months: 3, label: '3 oy', discount: '−8%' },
  { months: 6, label: '6 oy', discount: '−13%' },
  { months: 12, label: '12 oy', discount: '−17%' },
];

export function formatSom(n: number) {
  if (n === 0) return 'Bepul';
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
}
