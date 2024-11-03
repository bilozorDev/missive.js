import { BusKinds, MessageRegistry, MessageRegistryType, TypedMessage } from '../core/bus.js';

import { Middleware } from '../core/middleware.js';
import { createInMemoryLockAdapter } from '../adapters/in-memory-lock-adapter.js';
import { Envelope } from '../core/envelope.js';

export type LockAdapter = {
    acquire: (key: string, ttl: number) => Promise<boolean>;
    release: (key: string) => Promise<void>;
};

type BasicOptions = {
    ttl?: number;
    timeout?: number;
    tick?: number;
};

type Options<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>> = BasicOptions & {
    adapter?: LockAdapter;
    getLockKey: (envelope: Envelope<TypedMessage<MessageRegistry<BusKind, T>>>) => Promise<string>;
    intents?: {
        [K in keyof T]?: BasicOptions & {
            getLockKey?: (envelope: NarrowedEnvelope<BusKind, T, K>) => Promise<string>;
        };
    };
};

type NarrowedEnvelope<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>, K extends keyof T> = Envelope<
    TypedMessage<MessageRegistry<BusKind, Pick<T, K>>>
>;

export function createLockMiddleware<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>>(
    options: Options<BusKind, T>,
): Middleware<BusKind, T> {
    const adapter = options.adapter ?? createInMemoryLockAdapter();
    return async (envelope, next) => {
        const type = envelope.message.__type as keyof T;
        const ttl = options.intents?.[type]?.ttl ?? options.ttl ?? 500;
        const tick = options.intents?.[type]?.tick ?? options.tick ?? 100;
        const getLockKey = options.intents?.[type]?.getLockKey ?? options.getLockKey;
        const lockKey = await getLockKey(envelope);

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
