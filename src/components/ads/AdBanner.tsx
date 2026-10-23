import { useEffect, useRef, useState } from 'react';
import { gamEnabled } from '@/config/ads';
import { getGpt, mountRotatingSlot } from '@/lib/gpt';
import { cn } from '@/lib/utils';

/**
 * Banner size group — medium rectangle candidates plus 'fluid' so GAM can also
 * serve its responsive fluid creative into the same box. Listing wide
 * leaderboard / mobile-banner sizes is what made GPT serve a short, wide
 * strip; these square-ish sizes keep the box shape.
 */
const BANNER_SIZES: unknown[] = [[336, 280], 'fluid', [300, 250]];

/** Base of the GPT div id; every rendered instance gets its own suffix. */
const BANNER_DIV_ID = 'gam-banner-slot';

/** Height held for the box until GAM answers, so a filling ad does not shove the page. */
const RESERVED_HEIGHT_PX = 250;

type AdBannerProps = {
  /**
   * Names this banner's div id. GPT rejects two slots sharing one id, so the
   * banners placed inside the clip grid pass `'inline-1'`, `'inline-2'`, …
   * while the block above the page title keeps the default.
   */
  instance?: string;
  /** Layout overrides, e.g. an in-grid banner dropping the default top margin. */
  className?: string;
  /**
   * Request the ad only once the box is about to scroll into view, instead of on
   * mount. For banners below the fold: requests that are never seen are wasted
   * and drag the show rate down.
   */
  lazy?: boolean;
};

/** How far below the viewport a lazy banner starts its request. */
const LAZY_MARGIN = '400px 0px';

type FillState = 'pending' | 'filled' | 'empty';

/**
 * The boxed banner. The default instance sits inside the onboarding layout
 * directly above each screen's title; extra instances can be placed in the
 * page body (the clip grid puts one between every 4 cards). It mounts a GPT
 * in-page slot into a bordered "Advertisement" frame that inherits the card's
 * width and padding. Because it
 * lives in the per-screen layout it remounts on every navigation; mountRotatingSlot
 * destroys the previous screen's slot first, so the fixed div id stays valid.
 * Each remount takes the next banner tag from the odd/even rotation, and if GAM
 * answers with no ad on that tag it retries once on the other one.
 *
 * While the request is in flight the box holds RESERVED_HEIGHT_PX so a filling ad
 * causes no layout shift; if the final answer is "no ad" the whole block (label
 * included) collapses instead of leaving an empty frame. When `VITE_GAM_ENABLED`
 * is off it renders nothing at all.
 */
export function AdBanner({ instance = 'top', className, lazy = false }: AdBannerProps = {}) {
  const mounted = useRef(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState<FillState>('pending');
  const divId = `${BANNER_DIV_ID}-${instance}`;

  useEffect(() => {
    // `mounted` keeps React StrictMode's double-invoke from defining the slot
    // twice within one screen. The previous screen's slot is torn down on the
    // *next* mount inside mountInPageSlot.
    if (!gamEnabled || mounted.current) return;

    const start = (): void => {
      if (mounted.current) return;
      mounted.current = true;
      void (async () => {
        const gpt = await getGpt();
        if (!gpt) return;
        mountRotatingSlot(gpt, 'banner', BANNER_SIZES, divId, (filled) => {
          setFill(filled ? 'filled' : 'empty');
        });
      })();
    };

    const node = wrapper.current;
    if (!lazy || !node || typeof IntersectionObserver === 'undefined') {
      start();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: LAZY_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [divId, lazy]);

  if (!gamEnabled) return null;

  return (
    <div
      ref={wrapper}
      className={cn('mt-10 flex w-full flex-col items-center', fill === 'empty' && 'hidden', className)}
    >
      <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-wider text-fg-subtle">Advertisement</p>
      {/* The box must never clamp the creative's height: a fixed size plus
          overflow-hidden used to cut taller (e.g. fluid) creatives off. The
          min-height only holds the placeholder area until GAM has answered. */}
      <div
        className="flex w-full items-center justify-center"
        style={fill === 'pending' ? { minHeight: RESERVED_HEIGHT_PX } : undefined}
      >
        <div id={divId} aria-hidden="true" className="flex min-h-full w-full items-center justify-center" />
      </div>
    </div>
  );
}
