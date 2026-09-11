interface AvailabilityBadgeProps {
  available: boolean;
  /** Show the explanatory sentence next to the label. */
  detailed?: boolean;
  className?: string;
}

export default function AvailabilityBadge({ available, detailed = false, className = '' }: AvailabilityBadgeProps) {
  return (
    <span
      key={available ? 'free' : 'busy'}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none transition-colors duration-300 animate-fade-in ${
        available
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-destructive/30 bg-destructive/10 text-destructive'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {available && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${available ? 'bg-success' : 'bg-destructive'}`}
        />
      </span>
      {available ? "BO'SH" : 'BAND'}
      {detailed && (
        <span className="font-medium opacity-80">
          {available ? '— yangi buyurtma olish mumkin' : '— hozir buyurtma olish mumkin emas'}
        </span>
      )}
    </span>
  );
}
