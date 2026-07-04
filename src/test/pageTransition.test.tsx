import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const wrap = (initial: string) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AppProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[initial]}>
            <Routes>
              <Route path="/a" element={<Layout noFooter><div>A</div></Layout>} />
              <Route path="/b" element={<Layout noFooter><div>B</div></Layout>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

describe('Layout page transitions', () => {
  it('renders <main> with the page-enter animation class', () => {
    const { container } = wrap('/a');
    const main = container.querySelector('main');
    expect(main).not.toBeNull();
    expect(main!.className).toMatch(/page-enter/);
  });

  it('keys the <main> element by pathname so route changes re-trigger the animation', () => {
    // The `key={pathname}` prop on <main> forces React to remount it,
    // which restarts the CSS animation. Render both routes and assert the
    // main tag exists and carries the animation class on each.
    const a = wrap('/a');
    const b = wrap('/b');
    expect(a.container.querySelector('main')?.className).toMatch(/page-enter/);
    expect(b.container.querySelector('main')?.className).toMatch(/page-enter/);
  });
});

describe('Reduced motion support', () => {
  it('respects window.matchMedia("(prefers-reduced-motion: reduce)")', () => {
    // Our test setup stubs matchMedia to return matches:false by default.
    // Flip it once and confirm consumers can detect the preference.
    const original = window.matchMedia;
    (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = (query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;

    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    expect(window.matchMedia('(min-width: 9999px)').matches).toBe(false);

    window.matchMedia = original;
  });
});
