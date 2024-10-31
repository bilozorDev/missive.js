import NodeCache from 'node-cache';

export type StorageOptions = {
    prefix?: string;
    defaultTTL?: number;
};
const DEFAULT_TTL = 3600 * 8; // 8 hours as default

export const createMemoryStorage = <T>(options: StorageOptions = {}) => {
    const prefix = options?.prefix ?? '';
    const defaultTTL = options?.defaultTTL ?? DEFAULT_TTL;
    const store = new NodeCache({
        stdTTL: DEFAULT_TTL,
        checkperiod: 3600, // check every hour if someting can be deleted
        useClones: false,
        deleteOnExpire: true,
    });

    return {
        get: async (key: string): Promise<T | undefined> => {
            return await store.get<T>(`${prefix}${key}`);
        },
        set: async (key: string, value: any, ttl?: number): Promise<void> => {
            store.set(`${prefix}${key}`, value, ttl ?? defaultTTL);
        },
    };
};
