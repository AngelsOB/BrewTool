import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  loadJson,
  loadJsonSafe,
  saveJson,
  saveJsonSafe,
  deleteJson,
  isStorageAvailable,
  type StoredValue,
} from './storage';

// Mock localStorage for Node environment
const createMockStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    _store: store,
  };
};

describe('Storage Utility', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockStorage);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('isStorageAvailable', () => {
    test('returns true when localStorage is accessible', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    test('returns false when localStorage throws', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage blocked');
      });
      expect(isStorageAvailable()).toBe(false);
    });
  });

  describe('loadJsonSafe', () => {
    test('returns not_found when key does not exist', () => {
      const result = loadJsonSafe<string>('nonexistent');
      expect(result).toEqual({ ok: false, error: 'not_found' });
    });

    test('returns value for valid JSON', () => {
      mockStorage._store['test'] = JSON.stringify({ version: 1, value: 'hello' });
      const result = loadJsonSafe<string>('test');
      expect(result).toEqual({ ok: true, value: 'hello' });
    });

    test('unwraps versioned storage format', () => {
      const stored: StoredValue<{ name: string }> = { version: 1, value: { name: 'test' } };
      mockStorage._store['obj'] = JSON.stringify(stored);
      const result = loadJsonSafe<{ name: string }>('obj');
      expect(result).toEqual({ ok: true, value: { name: 'test' } });
    });

    test('handles non-versioned legacy format', () => {
      mockStorage._store['legacy'] = JSON.stringify({ name: 'legacy' });
      const result = loadJsonSafe<{ name: string }>('legacy');
      expect(result).toEqual({ ok: true, value: { name: 'legacy' } });
    });

    test('returns parse_error for corrupted JSON', () => {
      mockStorage._store['corrupted'] = 'not valid json {{{';
      const result = loadJsonSafe<string>('corrupted');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('parse_error');
        expect(result.rawData).toBe('not valid json {{{');
      }
    });

    test('returns storage_unavailable for SecurityError', () => {
      const securityError = new DOMException('Access denied', 'SecurityError');
      mockStorage.getItem.mockImplementation(() => {
        throw securityError;
      });
      const result = loadJsonSafe<string>('test');
      expect(result).toEqual({
        ok: false,
        error: 'storage_unavailable',
        message: 'Access denied',
      });
    });
  });

  describe('loadJson', () => {
    test('returns defaultValue when key not found', () => {
      const result = loadJson('missing', 'default');
      expect(result).toBe('default');
    });

    test('returns stored value when key exists', () => {
      mockStorage._store['key'] = JSON.stringify({ version: 1, value: 42 });
      const result = loadJson('key', 0);
      expect(result).toBe(42);
    });

    test('returns defaultValue for corrupted data and logs error', () => {
      mockStorage._store['bad'] = 'invalid json';
      const result = loadJson('bad', 'fallback');
      expect(result).toBe('fallback');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Corrupted data for key "bad"')
      );
    });

    test('returns defaultValue for storage unavailable and logs error', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage blocked');
      });
      const result = loadJson('test', 'default');
      expect(result).toBe('default');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Storage unavailable')
      );
    });

    test('does not log error for not_found (normal case)', () => {
      // Reset mock before this test to ensure clean state
      vi.mocked(console.error).mockClear();
      loadJson('missing', 'default');
      expect(console.error).not.toHaveBeenCalled();
    });

    test('handles arrays correctly', () => {
      mockStorage._store['arr'] = JSON.stringify({ version: 1, value: [1, 2, 3] });
      const result = loadJson<number[]>('arr', []);
      expect(result).toEqual([1, 2, 3]);
    });

    test('handles null values correctly', () => {
      mockStorage._store['null'] = JSON.stringify({ version: 1, value: null });
      const result = loadJson<string | null>('null', 'default');
      expect(result).toBeNull();
    });
  });

  describe('saveJsonSafe', () => {
    test('returns ok:true on successful save', () => {
      const result = saveJsonSafe('key', { name: 'test' });
      expect(result).toEqual({ ok: true });
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    test('wraps value in versioned format', () => {
      saveJsonSafe('key', 'value', 2);
      expect(mockStorage._store['key']).toBe(JSON.stringify({ version: 2, value: 'value' }));
    });

    test('returns quota_exceeded for QuotaExceededError', () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      mockStorage.setItem.mockImplementation(() => {
        throw quotaError;
      });
      const result = saveJsonSafe('key', 'large data');
      expect(result).toEqual({
        ok: false,
        error: 'quota_exceeded',
        message: 'Quota exceeded',
      });
    });

    test('returns storage_unavailable for other errors', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Unknown error');
      });
      const result = saveJsonSafe('key', 'data');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('storage_unavailable');
      }
    });
  });

  describe('saveJson', () => {
    test('saves successfully without throwing', () => {
      expect(() => saveJson('key', 'value')).not.toThrow();
    });

    test('throws and logs on quota exceeded', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });
      expect(() => saveJson('key', 'data')).toThrow('Storage quota exceeded');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('quota exceeded')
      );
    });

    test('throws and logs on storage unavailable', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Blocked');
      });
      expect(() => saveJson('key', 'data')).toThrow('Storage unavailable');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Storage unavailable')
      );
    });
  });

  describe('deleteJson', () => {
    test('returns true on successful delete', () => {
      mockStorage._store['toDelete'] = 'value';
      const result = deleteJson('toDelete');
      expect(result).toBe(true);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('toDelete');
    });

    test('returns false when storage throws', () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error('Access denied');
      });
      const result = deleteJson('key');
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete key')
      );
    });
  });

  describe('edge cases', () => {
    test('handles empty string value', () => {
      mockStorage._store['empty'] = JSON.stringify({ version: 1, value: '' });
      expect(loadJson('empty', 'default')).toBe('');
    });

    test('handles empty array value', () => {
      mockStorage._store['emptyArr'] = JSON.stringify({ version: 1, value: [] });
      expect(loadJson<number[]>('emptyArr', [1, 2, 3])).toEqual([]);
    });

    test('handles false boolean value', () => {
      mockStorage._store['false'] = JSON.stringify({ version: 1, value: false });
      expect(loadJson('false', true)).toBe(false);
    });

    test('handles zero value', () => {
      mockStorage._store['zero'] = JSON.stringify({ version: 1, value: 0 });
      expect(loadJson('zero', 42)).toBe(0);
    });

    test('handles deeply nested objects', () => {
      const nested = { a: { b: { c: { d: [1, 2, 3] } } } };
      saveJson('nested', nested);
      expect(loadJson('nested', null)).toEqual(nested);
    });
  });
});
