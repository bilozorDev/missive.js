import { createLoggerAdapter } from '../adapters/console-logger-adapter.js';
import { Envelope, HandledStamp, IdentityStamp, Stamp } from '../core/envelope.js';
import { GenericMiddleware } from '../core/middleware.js';

export type LoggerAdapter = {
    processing: LogFunction;
    processed: LogFunction;
    error: LogFunction;
};

export type LoggerInterface = {
    log: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
};

export type TimingsStamp = Stamp<{ total: number }, 'missive:timings'>;

type Step = keyof LoggerAdapter;
type LogFunction = <M, R>(
    identity: IdentityStamp | undefined,
    message: M,
    results: HandledStamp<R>[],
    stamps: Stamp[],
) => void | Promise<void>;

type Options = {
    adapter: LoggerAdapter;
    logger: LoggerInterface;
    collect: boolean;
    async: boolean;
};
export function createLoggerMiddleware({
    adapter,
    logger,
    collect = false,
    async = false,
}: Partial<Options> = {}): GenericMiddleware {
    if (!logger) {
        logger = console;
    }
    if (!adapter) {
        adapter = createLoggerAdapter(logger);
    }

    const log = async (step: Step, envelope: Envelope<unknown>) => {
        const identity = envelope.firstStamp<IdentityStamp>('missive:identity');
        const results = envelope.stampsOfType<HandledStamp<unknown>>('missive:handled');
        const promise = adapter[step](
            identity,
            envelope.message,
            results,
            envelope.stamps.filter((stamp) => stamp.type !== 'missive:identity' && stamp.type !== 'missive:handled'),
        );
        if (collect) {
            return promise;
        }
        if (!async && promise instanceof Promise) {
            await promise;
        }
    };
    const attachNanoTimingStamp = (startTime: number, envelope: Envelope<unknown>) => {
        const endTime = performance.now();
        const duration = (endTime - startTime) * 1000000; // nanoseconds
        envelope.addStamp<TimingsStamp>('missive:timings', {
            total: duration,
        });
    };

    return async (envelope, next) => {
        const startTime = performance.now();
        if (!collect) {
            await log('processing', envelope);
            try {
                await next();
                attachNanoTimingStamp(startTime, envelope);
                await log('processed', envelope);
            } catch (error) {
                attachNanoTimingStamp(startTime, envelope);
                await log('error', envelope);
                throw error;
            }
            return;
        }
        const logs: Array<() => Promise<void>> = [];
        logs.push(() => log('processing', envelope));
        try {
            await next();
            attachNanoTimingStamp(startTime, envelope);
            logs.push(() => log('processed', envelope));
        } catch (error) {
            attachNanoTimingStamp(startTime, envelope);
            logs.push(() => log('error', envelope));
            throw error;
        } finally {
            const allLogs = Promise.allSettled(logs.map((log) => log()));
            if (!async) {
                await allLogs;
            }
        }
    };
}
