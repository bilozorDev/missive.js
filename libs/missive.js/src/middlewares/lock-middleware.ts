import { BusKinds, MessageRegistryType } from '../core/bus.js';

import { Middleware } from '../core/middleware.js';
import { createInMemoryLockAdapter } from '../adapters/in-memory-lock-adapter.js';

export type LockAdapter = {
    acquire: (key: string, ttl: number) => Promise<boolean>;
    release: (key: string) => Promise<void>;
};

type BasicOptions = {
    ttl?: number;
    timeout?: number;
    tick?: number;
};

type Options<Def> = BasicOptions & {
    adapter: LockAdapter;
    intents?: Partial<Record<keyof Def, BasicOptions>>;
};

type Params<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>> = {
    getLockKey: (envelope: LockMiddlewareMessage<BusKind, T>) => string;
};

type LockMiddlewareMessage<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>> = Parameters<
    Middleware<BusKind, T>
>[0];

export function createLockMiddleware<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>>(
    { getLockKey }: Params<BusKind, T>,
    options: Partial<Options<T>> = {},
): Middleware<BusKind, T> {
    const adapter = options.adapter ?? createInMemoryLockAdapter();

    return async (envelope, next) => {
        const type = envelope.message.__type;
        const ttl = options.intents?.[type]?.ttl ?? options.ttl ?? 500;
        const tick = options.intents?.[type]?.tick ?? options.tick ?? 100;
        const lockKey = getLockKey(envelope);
        async function doUnderLock(timeout: number) {
            const isAcquired = await adapter.acquire(lockKey, ttl);
            if (isAcquired) {
                try {
                    await next();
                    await adapter.release(lockKey);
                    return;
                } catch (error) {
                    await adapter.release(lockKey);
                    throw error;
                }
            } else {
                if (Date.now() < timeout) {
                    await new Promise((resolve) => setTimeout(resolve, tick));
                    return doUnderLock(timeout);
                }

                throw new Error('Lock not acquired or timeout');
            }
        }
        await doUnderLock(Date.now() + (options.intents?.[type]?.timeout ?? options.timeout ?? 5000));
    };
}
