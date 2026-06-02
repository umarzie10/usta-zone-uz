import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global scroll-reveal:
 * Automatically tags common content blocks (cards, headings, sections)
 * with `.reveal` and toggles `.in-view` as they enter the viewport.
 * Idempotent — safe to re-run on every route change.
 */
export function useScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Tag pass — runs after route renders
    const tag = () => {
      const selectors = [
        'main section',
        'main h1',
        'main h2',
        'main h3',
        'main .card-premium',
        'main [data-reveal]',
      ];
      const nodes = document.querySelectorAll<HTMLElement>(selectors.join(','));
      nodes.forEach((el) => {
        if (el.dataset.revealApplied === '1') return;
        // Skip elements that already have explicit animation classes
        if (el.classList.contains('reveal') || el.classList.contains('animate-fade-in') || el.classList.contains('animate-fade-in-up') || el.classList.contains('animate-bounce-in')) return;
        el.classList.add('reveal');
        el.dataset.revealApplied = '1';
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const observe = () => {
      tag();
      // Auto-stagger siblings: for any container of multiple .reveal cards, index them 1..8
      document.querySelectorAll<HTMLElement>('main .grid, main .flex-wrap, main .space-y-4, main .space-y-3').forEach((container) => {
        const items = Array.from(container.children).filter((c): c is HTMLElement =>
          c instanceof HTMLElement && c.classList.contains('reveal') && !c.dataset.revealI
        );
        items.slice(0, 8).forEach((el, i) => { el.dataset.revealI = String(i + 1); });
      });
      document.querySelectorAll<HTMLElement>('.reveal, .reveal-left, .reveal-right, .reveal-zoom').forEach((el) => {
        if (!el.classList.contains('in-view')) io.observe(el);
      });
    };

    // Run multiple times to catch async content
    observe();
    const t1 = setTimeout(observe, 200);
    const t2 = setTimeout(observe, 800);
    const t3 = setTimeout(observe, 2000);

    // MutationObserver — catch lazily mounted content (lists, dialogs)
    const mo = new MutationObserver(() => observe());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, [pathname]);
}
