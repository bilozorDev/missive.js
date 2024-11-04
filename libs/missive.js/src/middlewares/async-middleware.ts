import { BusKinds, MessageRegistry, MessageRegistryType, TypedMessage } from '../core/bus.js';
import { Envelope, Stamp } from '../core/envelope.js';
import { Middleware } from '../core/middleware.js';

type Options<BusKind extends 'command' | 'event', T extends MessageRegistryType<BusKind>> =
    | {
          consume: false;
          async?: boolean;
          produce: (envelope: Envelope<TypedMessage<MessageRegistry<BusKind, T>>>) => Promise<void>;
          intents?: {
              [K in keyof T]?: {
                  async?: boolean;
                  produce?: (envelope: NarrowedEnvelope<BusKind, T, K>) => Promise<void>;
              };
          };
      }
    | {
          consume: true;
          async?: never;
          produce?: never;
          intents?: never;
      };

type NarrowedEnvelope<BusKind extends BusKinds, T extends MessageRegistryType<BusKind>, K extends keyof T> = Envelope<
    TypedMessage<MessageRegistry<BusKind, Pick<T, K>>>
>;

export type AsyncStamp = Stamp<undefined, 'missive:async'>;

export function createAsyncMiddleware<BusKind extends 'command' | 'event', T extends MessageRegistryType<BusKind>>({
    consume,
    intents,
    produce,
    async = true,
}: Options<BusKind, T>): Middleware<BusKind, T> {
    return async (envelope, next) => {
        const type = envelope.message.__type as keyof T;
        const isAsync = intents?.[type]?.async ?? async;
        // we need to push to the queue here and add a stamp for reference
        if (isAsync && consume === false) {
            envelope.addStamp<AsyncStamp>('missive:async');
            const producer = intents?.[type]?.produce ?? produce;
            await producer(envelope);
            return;
        }
        await next();
    };
}
