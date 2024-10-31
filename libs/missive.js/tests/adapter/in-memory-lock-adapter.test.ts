import { describe, expect, it } from 'vitest';
import { createInMemoryLockAdapter } from '../../src/adapters/in-memory-lock-adapter';

describe('InMemoryLockAdapter', () => {
    const adapter = createInMemoryLockAdapter();
    it('should acquire a lock', async () => {
        const isAcquired = await adapter.acquire('key', 100);
        expect(isAcquired).toBe(true);

        await adapter.release('key');
    });
    it('should be able to acquire a lock after the lock has expired', async () => {
        const isAcquired = await adapter.acquire('test', 0);
        expect(isAcquired).toBe(true);

        const isAcquired2 = await adapter.acquire('test', 100);
        expect(isAcquired2).toBe(true);

        await adapter.release('test');
    });

    it('should not be able to acquire a lock if it is not released', async () => {
        const isAcquired = await adapter.acquire('another-key', 10000);
        expect(isAcquired).toBe(true);

        const isAcquired2 = await adapter.acquire('another-key', 10000);
        expect(isAcquired2).toBe(false);

        await adapter.release('another-key');
    });

    it('should be able to release a lock', async () => {
        await adapter.release('non-existing-key');
    });
});
