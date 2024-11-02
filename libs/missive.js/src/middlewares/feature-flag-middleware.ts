import { BusKinds, MessageRegistry, MessageRegistryType, TypedMessage } from '../core/bus.js';
import { Envelope, HandledStamp, Stamp } from '../core/envelope.js';
import { Middleware } from '../core/middleware.js';

type Options<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>> = {
    featureFlagChecker: (intent: keyof T) => Promise<boolean>;
    intents: {
        [K in keyof T]?: {
            fallbackHandler: (envelope: Envelope<TypedMessage<MessageRegistry<BusKind, T>>>) => Promise<T[K]['result']>;
            shortCircuit?: boolean;
        };
    };
};

export type FeatureFlagFallbackStamp = Stamp<undefined, 'missive:feature-flag-fallback'>;

export function createFeatureFlagMiddleware<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>>({
    featureFlagChecker,
    intents,
}: Options<BusKind, T>): Middleware<BusKind, T> {
    return async (envelope, next) => {
        const type = envelope.message.__type as keyof T;

        const allowed = await featureFlagChecker(type);
        if (allowed) {
            await next();
            return;
        }
        const handler = intents?.[type]?.fallbackHandler;
        if (typeof handler === 'function') {
            const result = await handler(envelope);
            envelope.addStamp<HandledStamp<T[typeof type]['result']>>('missive:handled', result);
            envelope.addStamp<FeatureFlagFallbackStamp>('missive:feature-flag-fallback');
            const breakChain = typeof intents?.[type]?.shortCircuit === 'boolean' ? intents[type].shortCircuit : true;
            if (breakChain) {
                return;
            }
            await next();
            return;
        }
        throw new Error(`Intent ${envelope.message.__type} is not allowed and no fallback handler provided.`);
    };
}
