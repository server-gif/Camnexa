import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { gamEnabled } from '@/config/ads';
import { rotateAnchor } from '@/lib/gpt';

/**
 * The Google-managed anchor ad — the exact format from GPT's "Display an
 * anchor ad" sample (developers.google.com/publisher-tag/samples/display-anchor-ad):
 * the strip pinned to the bottom edge with the ⌄/⌃ expand-collapse tab. Google
 * injects and owns the overlay (collapse/dismiss UI included), so this
 * component renders no DOM of its own; the slot is mounted and swapped through
 * `rotateAnchor` in `src/lib/gpt.ts`. When `VITE_GAM_ENABLED` is off it does
 * nothing.
 *
 * Placement rule: the anchor shows on EVERY route, the home screen included —
 * the home screen is where nearly every visit starts and ends, so keeping the
 * anchor off it left the busiest page without one. Each route change calls
 * `rotateAnchor`, which mounts the anchor on the first view and swaps it to the
 * next tag in the odd/even rotation afterwards. The same-pathname guard makes
 * StrictMode's immediate double-invoke a no-op.
 */
export function AdAnchor() {
  const location = useLocation();
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!gamEnabled) return;
    const path = location.pathname;
    // Ignore a re-run for the pathname we already handled (StrictMode's
    // double-invoke, or any effect re-trigger without a real navigation).
    if (lastPathname.current === path) return;
    lastPathname.current = path;
    rotateAnchor();
  }, [location.pathname]);

  return null;
}
