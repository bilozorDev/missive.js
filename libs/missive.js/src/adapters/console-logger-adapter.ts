import { LoggerAdapter, LoggerInterface, TimingsStamp } from '../middlewares/logger-middleware.js';

export const createLoggerAdapter = (logger: LoggerInterface) => {
    const adapter: LoggerAdapter = {
        processing: (identity, message, results, stamps) =>
            logger.log(
                `[Envelope<${identity?.body?.id}>](Processing)`,
                JSON.stringify({
                    message,
                    results,
                    stamps,
                }),
            ),
        processed: (identity, message, results, stamps) => {
            const timings = stamps.filter((stamp) => stamp.type === 'missive:timings')?.[0] as TimingsStamp | undefined;
            logger.log(
                `[Envelope<${identity?.body?.id}>](Processed${timings?.body?.total ? ` in ${(timings.body.total / 1000000).toFixed(4)} ms` : ''})`,
                JSON.stringify({
                    message,
                    results,
                    stamps,
                }),
            );
        },
        error: (identity, message, results, stamps) => {
            const timings = stamps.filter((stamp) => stamp.type === 'missive:timings')?.[0] as TimingsStamp | undefined;
            logger.error(
                `[Envelope<${identity?.body?.id}>](Errored${timings?.body?.total ? ` in ${(timings.body.total / 1000000).toFixed(4)} ms` : ''}`,
                JSON.stringify({
                    message,
                    results,
                    stamps,
                }),
            );
        },
    };
    return adapter;
};
