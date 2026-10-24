import { beforeEach, describe, expect, it } from 'vitest';
import { captureAttribution, pageName } from './attribution';

function visit(search: string): void {
  window.history.pushState({}, '', `/${search}`);
}

describe('captureAttribution', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    visit('');
  });

  it('reads the Meta utm parameters into attribution fields', () => {
    visit(
      '?utm_medium=paid&utm_source=fb&utm_id=1&utm_content=111&utm_term=222&utm_campaign=333&fbclid=abc',
    );
    expect(captureAttribution()).toEqual({
      campaign: '333',
      adset: '222',
      ad: '111',
      source: 'fb',
      medium: 'paid',
    });
  });

  it('keeps the attribution after the query string is gone (SPA navigation)', () => {
    visit('?utm_campaign=333&utm_term=222');
    captureAttribution();
    visit('');
    expect(captureAttribution()).toEqual({ campaign: '333', adset: '222' });
  });

  it('re-attributes a visitor who arrives again from a different ad', () => {
    visit('?utm_campaign=333');
    captureAttribution();
    visit('?utm_campaign=444');
    expect(captureAttribution()).toEqual({ campaign: '444' });
  });

  it('strips characters GAM key-values reject and caps the length', () => {
    visit(`?utm_campaign=${encodeURIComponent('a b/c&d=e')}&utm_term=${'x'.repeat(80)}`);
    const result = captureAttribution();
    expect(result.campaign).toBe('abcde');
    expect(result.adset).toHaveLength(40);
  });

  it('returns nothing for an organic visit', () => {
    expect(captureAttribution()).toEqual({});
  });
});

describe('pageName', () => {
  it('names the routes for the `page` key-value', () => {
    expect(pageName('/')).toBe('landing');
    expect(pageName('/age')).toBe('age');
    expect(pageName('/girl-find')).toBe('girl-find');
    expect(pageName('/connect/')).toBe('connect');
  });
});
