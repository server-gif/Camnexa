/**
 * Google Ad Manager (GAM) configuration.
 *
 * Every ad unit path and the master on/off switch come from `VITE_GAM_*`
 * environment variables, so switching from Google's sample/test units to real
 * production units is a config change and never a code change. See `.env`.
 *
 * When `VITE_GAM_ENABLED` is unset or false the whole ad layer is inert: the
 * GPT script is never loaded (see `src/lib/gpt.ts`), the banner and anchor
 * render nothing, and the Continue / Connect / clip buttons navigate straight
 * away with no ad in the way. That is also what the test suite pins.
 *
 * Each placement accepts MULTIPLE unit paths via numbered env vars (`_1`, `_2`,
 * …). Requests then cycle through them in order (round-robin) — first request on
 * tag 1, second on tag 2, and so on, wrapping back to tag 1 after the last — so
 * every live unit keeps getting traffic and one starved unit cannot leave a slot
 * empty. On a no-fill the retry walks the rest of the list before giving up. A
 * placement with only one configured tag simply keeps reusing it. Banner is wired
 * for up to five tags (`_1`–`_5`); interstitial and anchor read `_1`/`_2`.
 * Rewarded has one tag.
 */

/** Placements that rotate between (up to) several unit paths, round-robin. */
export type GamRotatingPlacement = 'banner' | 'interstitial' | 'anchor';

/** The four placements the app fills. */
export type GamAdUnits = {
  /** Top banner shown on every screen; cycles through the configured tags. */
  banner: string[];
  /** Interstitial fired on Continue and when a clip card is tapped; alternates. */
  interstitial: string[];
  /** Rewarded ad fired on the Connect button (single tag). */
  rewarded: string;
  /** Anchor ad pinned to the bottom of the viewport; alternates. */
  anchor: string[];
};

/**
 * Google's official sample units, used when an env value is left blank so a
 * developer who only flips `VITE_GAM_ENABLED` still sees real test creatives
 * without a live GAM account.
 */
export const DEFAULT_AD_UNITS: GamAdUnits = {
  banner: ['/21775744923/example/banner', '/21775744923/example/adaptive-banner'],
  interstitial: ['/21775744923/example/interstitial', '/21775744923/example/interstitial'],
  rewarded: '/22639388115/rewarded_web_example',
  anchor: ['/21775744923/example/adaptive-banner', '/21775744923/example/adaptive-banner'],
};

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

/** Parse the master switch: only an explicit truthy value turns ads on. */
export function resolveGamEnabled(raw: string | undefined): boolean {
  return TRUTHY.has((raw ?? '').trim().toLowerCase());
}

/**
 * Collect every configured path for one rotating slot, dropping blanks. Pass the
 * env values in tag order (`_1`, `_2`, …); the rotation walks the resulting list
 * round-robin, so the number of supported tags is just how many you hand in.
 */
export function resolveAdUnitList(
  values: (string | undefined)[],
  fallback: string | undefined,
): string[] {
  const configured = values
    .map((value) => (value ?? '').trim())
    .filter((value) => value !== '');
  return configured.length > 0 ? configured : [(fallback ?? '').trim()];
}

/** Fall back to the sample unit when an env path is blank. */
export function resolveAdUnits(env: {
  VITE_GAM_BANNER_AD_UNIT_1?: string;
  VITE_GAM_BANNER_AD_UNIT_2?: string;
  VITE_GAM_BANNER_AD_UNIT_3?: string;
  VITE_GAM_BANNER_AD_UNIT_4?: string;
  VITE_GAM_BANNER_AD_UNIT_5?: string;
  VITE_GAM_INTERSTITIAL_AD_UNIT_1?: string;
  VITE_GAM_INTERSTITIAL_AD_UNIT_2?: string;
  VITE_GAM_REWARDED_AD_UNIT?: string;
  VITE_GAM_ANCHOR_AD_UNIT_1?: string;
  VITE_GAM_ANCHOR_AD_UNIT_2?: string;
}): GamAdUnits {
  const pick = (value: string | undefined, fallback: string): string => {
    const trimmed = (value ?? '').trim();
    return trimmed === '' ? fallback : trimmed;
  };
  return {
    banner: resolveAdUnitList(
      [
        env.VITE_GAM_BANNER_AD_UNIT_1,
        env.VITE_GAM_BANNER_AD_UNIT_2,
        env.VITE_GAM_BANNER_AD_UNIT_3,
        env.VITE_GAM_BANNER_AD_UNIT_4,
        env.VITE_GAM_BANNER_AD_UNIT_5,
      ],
      DEFAULT_AD_UNITS.banner[0],
    ),
    interstitial: resolveAdUnitList(
      [env.VITE_GAM_INTERSTITIAL_AD_UNIT_1, env.VITE_GAM_INTERSTITIAL_AD_UNIT_2],
      DEFAULT_AD_UNITS.interstitial[0],
    ),
    rewarded: pick(env.VITE_GAM_REWARDED_AD_UNIT, DEFAULT_AD_UNITS.rewarded),
    anchor: resolveAdUnitList(
      [env.VITE_GAM_ANCHOR_AD_UNIT_1, env.VITE_GAM_ANCHOR_AD_UNIT_2],
      DEFAULT_AD_UNITS.anchor[0],
    ),
  };
}

/** True when the build was told to load and show GAM ads. */
export const gamEnabled = resolveGamEnabled(import.meta.env.VITE_GAM_ENABLED);

/** The resolved ad unit paths, env-overridden with sample-unit fallbacks. */
export const adUnits: GamAdUnits = resolveAdUnits(import.meta.env);

/** Requests served per rotating placement; drives the round-robin cycling. */
const requestCounts: Record<GamRotatingPlacement, number> = {
  banner: 0,
  interstitial: 0,
  anchor: 0,
};

/** Pure round-robin picker: request 0 → first tag, request 1 → second, wrapping after the last. */
export function rotateAdUnit(units: string[], count: number): string {
  if (units.length === 0) return '';
  return units[count % units.length] ?? '';
}

/**
 * Take the next unit path for a rotating placement, cycling through the
 * configured tags in order on every call (every banner/anchor remount, every
 * interstitial refill). Call this whenever a request is about to be made.
 */
export function nextAdUnit(placement: GamRotatingPlacement): string {
  const units = adUnits[placement];
  const unit = rotateAdUnit(units, requestCounts[placement]);
  requestCounts[placement] += 1;
  return unit || units[0] || '';
}
