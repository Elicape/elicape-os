export interface IStorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class LocalStorageProvider implements IStorageProvider {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

let storageProvider: IStorageProvider | null = null;

export function setStorageProvider(provider: IStorageProvider): void {
  storageProvider = provider;
}

export function getStorageProvider(): IStorageProvider {
  if (!storageProvider) {
    storageProvider = new LocalStorageProvider();
  }
  return storageProvider;
}

export function getStorageItem<T>(key: string, defaultValue?: T): T | null {
  const provider = getStorageProvider();
  const value = provider.getItem(key);

  if (value === null) {
    return defaultValue ?? null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value as unknown as T;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  const provider = getStorageProvider();
  if (value === null || value === undefined) {
    provider.removeItem(key);
  } else {
    provider.setItem(key, JSON.stringify(value));
  }
}


