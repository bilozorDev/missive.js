import { createMemoryCacheAdapter } from '../adapters/in-memory-cache-adapter.js';
import { QueryMessageRegistryType } from '../core/bus.js';
import { HandledStamp, Stamp } from '../core/envelope.js';
import { Middleware } from '../core/middleware.js';

export type CacherAdapter = {
    get: (key: string) => Promise<unknown | null>;
    set: (key: string, value: unknown, ttl: number) => Promise<void>;
};

export type CacheableStamp = Stamp<{ ttl?: number }, 'missive:cacheable'>;
export type FromCacheStamp = Stamp<undefined, 'missive:cache:hit'>;

const hashKey = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

type Options = {
    adapter: CacherAdapter;
    cache?: 'all' | 'only-cacheable';
    defaultTtl?: number;
};

export function createCacherMiddleware<T extends QueryMessageRegistryType>({
    adapter,
    cache = 'all',
    defaultTtl = 3600,
}: Partial<Options> = {}): Middleware<'query', T> {
    if (!adapter) {
        adapter = createMemoryCacheAdapter();
    }
    return async (envelope, next) => {
        const key = await hashKey(JSON.stringify(envelope.message));
        const cached = await adapter.get(key);
        if (cached) {
            envelope.addStamp<HandledStamp<unknown>>('missive:handled', cached);
            envelope.addStamp<FromCacheStamp>('missive:cache:hit');
            return;
        }

        await next();
        const result = envelope.lastStamp<HandledStamp<unknown>>('missive:handled');
        const cacheableStamp = envelope.firstStamp<CacheableStamp>('missive:cacheable');

        if (cacheableStamp || cache === 'all' || (cache === 'only-cacheable' && cacheableStamp)) {
            await adapter.set(key, result?.body, cacheableStamp?.body?.ttl || defaultTtl);
        }
    };
}
