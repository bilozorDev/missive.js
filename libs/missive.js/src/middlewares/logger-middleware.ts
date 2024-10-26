import { Envelope, HandledStamp, IdentityStamp, Stamp } from '../core/envelope';
import { GenericMiddleware } from '../core/middleware';

export type LoggerAdapter = {
    processing: LogFunction;
    processed: LogFunction;
    error: LogFunction;
};
type Step = keyof LoggerAdapter;
type LogFunction = <M, R>(
    identity: IdentityStamp | undefined,
    message: M,
    results: HandledStamp<R>[],
    stamps: Stamp[],
) => void | Promise<void>;

type Options = {
    collect: boolean;
    async: boolean;
};
export function createLoggerMiddleware(
    logger: LoggerAdapter,
    { collect = false, async = false }: Partial<Options> = {},
): GenericMiddleware {
    const log = async (step: Step, envelope: Envelope<unknown>) => {
        const identity = envelope.firstStamp<IdentityStamp>('missive:identity');
        const results = envelope.stampsOfType<HandledStamp<unknown>>('missive:handled');
        const promise = logger[step](
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
    return async (envelope, next) => {
        if (!collect) {
            await log('processing', envelope);
            try {
                await next();
                await log('processed', envelope);
            } catch (error) {
                await log('error', envelope);
                throw error;
            }
            return;
        }
        const logs: Array<() => Promise<void>> = [];
        logs.push(() => log('processing', envelope));
        try {
            await next();
            logs.push(() => log('processed', envelope));
        } catch (error) {
            logs.push(() => log('error', envelope));
            throw error;
        } finally {
            const allLogs = Promise.all(logs.map((log) => log()));
            if (!async) {
                await allLogs;
            }
        }
    };
}
