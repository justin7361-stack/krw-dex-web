import { useState, useEffect } from 'react';

/**
 * Returns true while the window matches the given CSS media query string.
 * Re-evaluates on window resize via MediaQueryList.addEventListener.
 *
 * P-3 fix: replaces `window.innerWidth < 600` hard-code throughout the app.
 * Usage: `const isMobile = useMediaQuery('(max-width: 37.499rem)')` — matches
 * the Tailwind `notMobile` breakpoint (37.5rem = 600px).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);   // sync on mount in case SSR default differs
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Convenience alias: true when viewport is < 600px (mobile breakpoint) */
export const MOBILE_QUERY = '(max-width: 37.499rem)';
