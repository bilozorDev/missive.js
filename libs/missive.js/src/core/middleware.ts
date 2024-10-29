import type { BusKinds, MessageRegistry, MessageRegistryType, TypedMessage } from './bus.js';
import type { Envelope } from './envelope.js';

export type Middleware<BusKind extends BusKinds, HandlerDefinitions extends MessageRegistryType<BusKind>> = (
    envelope: Envelope<TypedMessage<MessageRegistry<BusKind, HandlerDefinitions>>>,
    next: () => Promise<void>,
) => Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericMiddleware = Middleware<BusKinds, any>;
