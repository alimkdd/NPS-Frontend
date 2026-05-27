const STORAGE_KEY = 'nps.adminKey';

export const adminAuth = {
  get: (): string | null => {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set: (key: string): void => {
    try {
      sessionStorage.setItem(STORAGE_KEY, key);
    } catch {
      /* sessionStorage unavailable — caller falls back to in-memory */
    }
  },
  clear: (): void => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  },
};
