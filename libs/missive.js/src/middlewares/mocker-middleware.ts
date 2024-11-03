import { BusKinds, MessageRegistry, MessageRegistryType, TypedMessage } from '../core/bus.js';
import { Envelope, HandledStamp } from '../core/envelope.js';
import { Middleware } from '../core/middleware.js';

type Options<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>> = {
    intents: {
        [K in keyof T]?: (envelope: Envelope<TypedMessage<MessageRegistry<BusKind, T>>>) => Promise<T[K]['result']>;
    };
};
export function createMockerMiddleware<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>>({
    intents,
}: Options<BusKind, T>): Middleware<BusKind, T> {
    return async (envelope, next) => {
        const type = envelope.message.__type as keyof T;
        const handler = intents?.[type];
        if (typeof handler === 'function') {
            const result = await handler(envelope);
            envelope.addStamp<HandledStamp<T[typeof type]['result']>>('missive:handled', result);
        }
        await next();
    };
}
