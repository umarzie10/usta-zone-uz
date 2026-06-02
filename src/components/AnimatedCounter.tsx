import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number;
  decimals?: number;
  format?: (n: number) => string;
  className?: string;
  suffix?: string;
  prefix?: string;
}

/**
 * Smoothly counts up to `value` when scrolled into view.
 * Re-runs whenever `value` changes.
 */
export default function AnimatedCounter({
  value,
  duration = 1100,
  decimals = 0,
  format,
  className,
  suffix = '',
  prefix = '',
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    startedRef.current = false;
    setDisplay(0);
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const start = performance.now();
      const from = 0;
      const to = Number(value) || 0;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(from + (to - from) * eased);
        if (p < 1) requestAnimationFrame(tick);
        else setDisplay(to);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run();
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const text = format
    ? format(display)
    : display.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });

  return <span ref={ref} className={className}>{prefix}{text}{suffix}</span>;
}
