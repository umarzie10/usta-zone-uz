import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  number?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * "Asoschi Usta" — platformaga birinchi qo'shilgan 100 ta usta uchun maxsus nishon.
 */
export default function FoundingMasterBadge({ number, size = 'md', className }: Props) {
  if (!number || number > 100) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold text-primary-foreground shadow-md animate-fade-in',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className
      )}
      style={{ background: 'var(--gradient-accent)' }}
      title={`Asoschi Usta #${number} — birinchi 100 ta ustadan biri`}
    >
      <Crown className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      Asoschi Usta #{number}
    </span>
  );
}
