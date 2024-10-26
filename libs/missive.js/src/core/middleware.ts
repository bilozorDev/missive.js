import type {
    BusKinds,
    CommandMessageRegistryType,
    EventMessageRegistryType,
    MessageRegistry,
    MessageRegistryType,
    QueryMessageRegistryType,
} from './bus';
import type { Envelope } from './envelope';

export type Middleware<BusKind extends BusKinds, HandlerDefinitions extends MessageRegistryType<BusKind>> = (
    envelope: Envelope<MessageRegistry<BusKind, HandlerDefinitions>>,
    next: () => Promise<void>,
) => Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericMiddleware = Middleware<any, any>;

export type CommandMiddleware<HandlerDefinitions extends CommandMessageRegistryType> = Middleware<
    'command',
    HandlerDefinitions
>;
export type QueryMiddleware<HandlerDefinitions extends QueryMessageRegistryType> = Middleware<
    'query',
    HandlerDefinitions
>;
export type EventMiddleware<HandlerDefinitions extends EventMessageRegistryType> = Middleware<
    'event',
    HandlerDefinitions
>;
