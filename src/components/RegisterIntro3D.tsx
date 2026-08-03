import { useEffect, useState } from 'react';
import LoginScene3D from './LoginScene3D';

interface Props {
  title?: string;
  subtitle?: string;
  duration?: number;
  onDone: () => void;
}

/**
 * Fullscreen 3D intro shown right after the user taps "Register".
 * Auto-dismisses after `duration` ms, or instantly when clicked/skipped.
 */
export default function RegisterIntro3D({
  title = "Ro'yxatdan o'tish",
  subtitle = 'Ustalar dunyosiga xush kelibsiz',
  duration = 2200,
  onDone,
}: Props) {
  const [closing, setClosing] = useState(false);

  const finish = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onDone, 350);
  };

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onDone();
      return;
    }
    const t = setTimeout(finish, duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="presentation"
      onClick={finish}
      className={`fixed inset-0 z-[100] cursor-pointer transition-opacity duration-300 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0">
        <LoginScene3D />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/70" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <h2 className="text-3xl sm:text-5xl font-black text-primary-foreground [text-shadow:_0_4px_28px_rgb(0_0_0_/_65%)] animate-fade-in-up">
          {title}
        </h2>
        <p className="mt-3 text-base sm:text-lg text-primary-foreground/85 animate-fade-in-up [animation-delay:150ms] [text-shadow:_0_2px_16px_rgb(0_0_0_/_60%)]">
          {subtitle}
        </p>
        <div className="mt-8 h-1 w-40 rounded-full bg-primary-foreground/20 overflow-hidden">
          <div
            className="h-full bg-primary-foreground/80 rounded-full"
            style={{ animation: `intro-progress ${duration}ms linear forwards` }}
          />
        </div>
        <span className="mt-4 text-xs text-primary-foreground/60">O'tkazib yuborish uchun bosing</span>
      </div>
      <style>{`@keyframes intro-progress { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}
