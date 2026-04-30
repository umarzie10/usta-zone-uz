import { useEffect, useState } from 'react';
import { MapPin, Navigation, Clock } from 'lucide-react';

interface LiveTrackerProps {
  masterName: string;
  initialEtaMin?: number;
}

/**
 * Demo (animatsion) live tracker - Yandex Maps API ulanmaguncha vaqtinchalik ishlaydi.
 * Foiz asosida usta mijoz tomon yo'l bosishini animatsiya qiladi.
 */
export default function LiveTracker({ masterName, initialEtaMin = 12 }: LiveTrackerProps) {
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(initialEtaMin);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 0.7, 100));
      setEta(e => Math.max(e - 0.1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="font-bold">Usta yo'lda</h3>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Clock className="h-4 w-4" />
          {eta.toFixed(0)} daq
        </div>
      </div>

      {/* Trackbar */}
      <div className="relative h-32 rounded-2xl bg-gradient-to-br from-primary/5 via-muted to-success/5 overflow-hidden border border-border/50">
        {/* Route line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 128" preserveAspectRatio="none">
          <path
            d="M 30 90 Q 130 30, 200 70 T 370 50"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="3"
            strokeDasharray="6 4"
            fill="none"
          />
          <path
            d="M 30 90 Q 130 30, 200 70 T 370 50"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            fill="none"
            strokeDasharray="400"
            strokeDashoffset={400 - (400 * progress) / 100}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Master marker (moving) */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
          style={{
            left: `${10 + (progress * 0.85)}%`,
            top: progress < 50 ? `${70 - progress * 0.6}%` : `${40 + (progress - 50) * 0.2}%`,
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-40"></div>
            <div className="relative bg-primary text-primary-foreground rounded-full w-9 h-9 flex items-center justify-center shadow-lg">
              <Navigation className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Start (master) */}
        <div className="absolute left-2 bottom-2 flex items-center gap-1 bg-background/80 backdrop-blur px-2 py-1 rounded-full text-xs">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="font-medium">{masterName}</span>
        </div>

        {/* End (client) */}
        <div className="absolute right-2 top-2 flex items-center gap-1 bg-background/80 backdrop-blur px-2 py-1 rounded-full text-xs">
          <MapPin className="h-3 w-3 text-success" />
          <span className="font-medium">Siz</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Yo'l bosildi: {progress.toFixed(0)}%</span>
        <span className="text-amber-600">⚠ Demo rejim — Yandex API kerak</span>
      </div>
    </div>
  );
}
