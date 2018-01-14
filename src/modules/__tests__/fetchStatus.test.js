import { FetchStatus, resolveInitialFetchStatus, resolveFetchStatus } from '../fetchStatus';

const itemNone = { fetchStatus: FetchStatus.NONE };
const itemLoading = { fetchStatus: FetchStatus.LOADING };
const itemLoaded = { fetchStatus: FetchStatus.LOADED };
const itemFailed = { fetchStatus: FetchStatus.FAILED };

describe('FetchStatus', () => {
  describe('resolveInitialFetchStatus', () => {
    test('returns LOADED if any value is LOADED', () => {
      expect(resolveInitialFetchStatus(itemLoading, itemFailed, itemLoaded)).toBe(FetchStatus.LOADED);
    });

    test('returns LOADING if any value is LOADING', () => {
      expect(resolveInitialFetchStatus(itemNone, itemFailed, itemLoading)).toBe(FetchStatus.LOADING);
    });

    test('returns FAILED if any value is FAILED', () => {
      expect(resolveInitialFetchStatus(itemNone, itemFailed, itemNone)).toBe(FetchStatus.FAILED);
    });

    test('returns NONE if all are NONE', () => {
      expect(resolveInitialFetchStatus(itemNone)).toBe(FetchStatus.NONE);
    });
  });

  describe('resolveFetchStatus', () => {
    test('returns FAILED if any value is FAILED', () => {
      expect(resolveFetchStatus(itemLoaded, itemFailed, itemLoading)).toBe(FetchStatus.FAILED);
    });

    test('returns LOADING if any value is LOADING but not FAILED', () => {
      expect(resolveFetchStatus(itemLoaded, itemNone, itemLoading)).toBe(FetchStatus.LOADING);
    });

    test('returns LOADED if all values are LOADED', () => {
      expect(resolveFetchStatus(itemLoaded, itemLoaded, itemLoaded)).toBe(FetchStatus.LOADED);
    });

    test('returns NONE if all values are NONE', () => {
      expect(resolveFetchStatus(itemNone, { fetchStatus: FetchStatus.NONE })).toBe(FetchStatus.NONE);
    });
  });
});
