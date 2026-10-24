/**
 * Paid-traffic attribution for ad reporting.
 *
 * Meta appends `utm_campaign`, `utm_term` (ad set), `utm_content` (ad),
 * `utm_source` and `utm_medium` to the landing URL. The values are captured once
 * on arrival and kept in sessionStorage, because the SPA drops the query string
 * on the first navigation (`/` -> `/age`). They are sent to Google Ad Manager as
 * key-values (see `applyAttributionTargeting` in gpt.ts), so revenue can be
 * reported per campaign / ad set / ad and joined with the Meta spend report.
 *
 * Only `[A-Za-z0-9_-]` survives and values are capped at 40 characters, which is
 * what GAM key-values accept. Everything is best-effort: storage or URL errors
 * never reach the page.
 */

const STORAGE_KEY = 'cn:attribution';
const MAX_LENGTH = 40;

export type Attribution = {
  campaign?: string;
  adset?: string;
  ad?: string;
  source?: string;
  medium?: string;
};

/** Query-string parameter -> attribution field. */
const PARAMS: Record<string, keyof Attribution> = {
  utm_campaign: 'campaign',
  utm_term: 'adset',
  utm_content: 'ad',
  utm_source: 'source',
  utm_medium: 'medium',
};

function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  const safe = value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, MAX_LENGTH);
  return safe === '' ? undefined : safe;
}

function readStored(): Attribution {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Attribution) : {};
  } catch {
    return {};
  }
}

/**
 * Read the attribution from the current URL (when it carries UTM parameters) or
 * from this session's stored copy. A URL that carries any UTM parameter replaces
 * the stored copy, so a visitor arriving from a different ad is re-attributed.
 */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  const fromUrl: Attribution = {};
  try {
    const query = new URLSearchParams(window.location.search);
    for (const [param, field] of Object.entries(PARAMS)) {
      const value = clean(query.get(param));
      if (value) fromUrl[field] = value;
    }
  } catch {
    /* an unparsable URL just means no attribution */
  }
  if (Object.keys(fromUrl).length === 0) return readStored();
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
  } catch {
    /* storage can be blocked (private mode, in-app browsers); the URL copy still works for this load */
  }
  return fromUrl;
}

/** Route path -> the short page name sent as the `page` key-value. */
export function pageName(pathname: string): string {
  if (pathname === '/') return 'landing';
  const name = pathname.replace(/^\/+/, '').split('/')[0] ?? '';
  return clean(name) ?? 'other';
}
