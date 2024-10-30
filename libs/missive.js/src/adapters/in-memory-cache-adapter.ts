import { CacherAdapter } from '../middlewares/cacher-middleware.js';

export const createMemoryCacheAdapter = (): CacherAdapter => {
    const memory = new Map<string, { value: unknown; expiresAt: number }>();
    return {
        get: async (key) => {
            const entry = memory.get(key);
            if (entry && Date.now() < entry.expiresAt) {
                return entry.value;
            }
            memory.delete(key);
            return null;
        },
        set: async (key: string, value, ttl) => {
            const expiresAt = Date.now() + ttl * 1000;
            memory.set(key, { value, expiresAt });
        },
    };
};
