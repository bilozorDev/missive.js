import type { Schema as ZodSchema } from 'zod';
import { createEnvelope, HandledStamp, IdentityStamp, type Envelope } from './envelope.js';
import type { Prettify, ReplaceKeys } from '../utils/types.js';
import type { Middleware } from './middleware.js';
import { nanoid } from 'nanoid';
import { createLoggerMiddleware } from '../middlewares/logger-middleware.js';
import { createCacherMiddleware } from '../middlewares/cacher-middleware.js';
import { createRetryerMiddleware } from '../middlewares/retryer-middleware.js';
import { createWebhookMiddleware } from '../middlewares/webhook-middleware.js';
import { createLockMiddleware } from '../middlewares/lock-middleware.js';

export type BusKinds = 'query' | 'command' | 'event';
export type MessageRegistryType<BusKind extends BusKinds> = Record<string, HandlerDefinition<BusKind>>;
export type CommandMessageRegistryType = Record<string, HandlerDefinition<'command'>>;
export type QueryMessageRegistryType = Record<string, HandlerDefinition<'query'>>;
export type EventMessageRegistryType = Record<string, HandlerDefinition<'event'>>;

export type MessageRegistry<
    BusKind extends BusKinds,
    HandlerDefinitions extends MessageRegistryType<BusKind>,
> = HandlerDefinitions[keyof HandlerDefinitions][BusKind];

export type TypedMessage<Message, MessageName extends string = string> = Message & { __type: MessageName };

type MessageHandler<Intent, Result> = (envelope: Envelope<Intent>) => Promise<Result>;
export type HandlerDefinition<BusKind extends BusKinds, Intent = object, Result = object> = {
    [key in BusKind]: Intent;
} & {
    result: Result;
};

export type CommandHandlerDefinition<Name extends string, Command = object, Result = object> = {
    [key in Name]: {
        command: Command;
        result: Result;
    };
};
export type QueryHandlerDefinition<Name extends string, Query = object, Result = object> = {
    [key in Name]: {
        query: Query;
        result: Result;
    };
};
export type EventHandlerDefinition<Name extends string, Event = object, Result = object> = {
    [key in Name]: {
        event: Event;
        result: Result;
    };
};

type ExtractedMessage<
    BusKind extends BusKinds,
    HandlerDefinitions extends MessageRegistryType<BusKind>,
    MessageName extends keyof HandlerDefinitions & string,
> = TypedMessage<HandlerDefinitions[MessageName][BusKind], MessageName>;

type MissiveBus<BusKind extends BusKinds, HandlerDefinitions extends MessageRegistryType<BusKind>> = {
    use: (middleware: Middleware<BusKind, HandlerDefinitions>) => void;
    register: <MessageName extends keyof HandlerDefinitions & string>(
        type: MessageName,
        schema: ZodSchema<HandlerDefinitions[MessageName][BusKind]>,
        handler: MessageHandler<HandlerDefinitions[MessageName][BusKind], HandlerDefinitions[MessageName]['result']>,
    ) => void;
    dispatch: <MessageName extends keyof HandlerDefinitions & string>(
        intent: TypedMessage<HandlerDefinitions[MessageName][BusKind], MessageName>,
    ) => Promise<{
        envelope: Envelope<HandlerDefinitions[MessageName][BusKind]>;
        result: HandlerDefinitions[MessageName]['result'] | undefined;
    }>;
    createIntent: <MessageName extends keyof HandlerDefinitions & string>(
        type: MessageName,
        intent: HandlerDefinitions[MessageName][BusKind],
    ) => TypedMessage<HandlerDefinitions[MessageName][BusKind], MessageName>;
};

type MissiveCommandBus<HandlerDefinitions extends CommandMessageRegistryType> = ReplaceKeys<
    MissiveBus<'command', HandlerDefinitions>,
    { createCommand: 'createIntent' }
> & {
    useLoggerMiddleware: (...props: Parameters<typeof createLoggerMiddleware<'command', HandlerDefinitions>>) => void;
    useRetryerMiddleware: (...props: Parameters<typeof createRetryerMiddleware<'command', HandlerDefinitions>>) => void;
    useWebhookMiddleware: (...props: Parameters<typeof createWebhookMiddleware<'command', HandlerDefinitions>>) => void;
    useLockMiddleware: (...props: Parameters<typeof createLockMiddleware<'command', HandlerDefinitions>>) => void;
};

export type CommandBus<HandlerDefinitions extends CommandMessageRegistryType> = Prettify<
    MissiveCommandBus<HandlerDefinitions>
>;

type MissiveQueryBus<HandlerDefinitions extends QueryMessageRegistryType> = ReplaceKeys<
    MissiveBus<'query', HandlerDefinitions>,
    { createQuery: 'createIntent' }
> & {
    useLoggerMiddleware: (...props: Parameters<typeof createLoggerMiddleware<'query', HandlerDefinitions>>) => void;
    useRetryerMiddleware: (...props: Parameters<typeof createRetryerMiddleware<'query', HandlerDefinitions>>) => void;
    useWebhookMiddleware: (...props: Parameters<typeof createWebhookMiddleware<'query', HandlerDefinitions>>) => void;
    useLockMiddleware: (...props: Parameters<typeof createLockMiddleware<'query', HandlerDefinitions>>) => void;
    useCacherMiddleware: (...props: Parameters<typeof createCacherMiddleware<HandlerDefinitions>>) => void;
};
export type QueryBus<HandlerDefinitions extends QueryMessageRegistryType> = Prettify<
    MissiveQueryBus<HandlerDefinitions>
>;

type MissiveEventBus<HandlerDefinitions extends EventMessageRegistryType> = ReplaceKeys<
    MissiveBus<'event', HandlerDefinitions>,
    { createEvent: 'createIntent' }
> & {
    useLoggerMiddleware: (...props: Parameters<typeof createLoggerMiddleware<'event', HandlerDefinitions>>) => void;
    useRetryerMiddleware: (...props: Parameters<typeof createRetryerMiddleware<'event', HandlerDefinitions>>) => void;
    useWebhookMiddleware: (...props: Parameters<typeof createWebhookMiddleware<'event', HandlerDefinitions>>) => void;
    useLockMiddleware: (...props: Parameters<typeof createLockMiddleware<'event', HandlerDefinitions>>) => void;
};
export type EventBus<HandlerDefinitions extends EventMessageRegistryType> = Prettify<
    MissiveEventBus<HandlerDefinitions>
>;

type HandlerConfig<
    BusKind extends BusKinds,
    HandlerDefinitions extends MessageRegistryType<BusKind>,
    MessageName extends keyof HandlerDefinitions & string = keyof HandlerDefinitions & string,
> = HandlerDefinitions[MessageName] extends infer Definitions
    ? Definitions extends Record<string, unknown>
        ? {
              messageName: MessageName;
              schema: ZodSchema<Definitions[BusKind]>;
              handler: MessageHandler<Definitions[BusKind], Definitions['result']>;
          }
        : never
    : never;

const createBus = <BusKind extends BusKinds, HandlerDefinitions extends MessageRegistryType<BusKind>>(args?: {
    middlewares?: Middleware<BusKind, HandlerDefinitions>[];
    handlers?: HandlerConfig<BusKind, HandlerDefinitions>[];
}): MissiveBus<BusKind, HandlerDefinitions> => {
    const middlewares: Middleware<BusKind, HandlerDefinitions>[] = args?.middlewares || [];

    const registry: {
        [MessageName in keyof HandlerDefinitions & string]?: {
            schema: ZodSchema<HandlerDefinitions[MessageName][BusKind]>;
            handlers: MessageHandler<
                HandlerDefinitions[MessageName][BusKind],
                HandlerDefinitions[MessageName]['result']
            >[];
        };
    } = {};

    const useMiddleware = (middleware: Middleware<BusKind, HandlerDefinitions>) => {
        middlewares.push(middleware);
    };

    const registerHandler = <MessageName extends keyof HandlerDefinitions & string>(
        messageName: MessageName,
        schema: ZodSchema<HandlerDefinitions[MessageName][BusKind]>,
        handler: MessageHandler<HandlerDefinitions[MessageName][BusKind], HandlerDefinitions[MessageName]['result']>,
    ) => {
        if (!registry[messageName]) {
            registry[messageName] = { schema, handlers: [] };
        }
        registry[messageName].handlers.push(handler);
    };

    if (args?.handlers) {
        for (const { messageName, schema, handler } of args.handlers) {
            registerHandler(messageName as keyof HandlerDefinitions & string, schema, handler);
        }
    }

    const createMiddlewareChain = <MessageName extends keyof HandlerDefinitions & string>(
        handlers: MessageHandler<HandlerDefinitions[MessageName][BusKind], HandlerDefinitions[MessageName]['result']>[],
    ) => {
        return async (message: HandlerDefinitions[MessageName][BusKind]) => {
            const envelope: Envelope<HandlerDefinitions[MessageName][BusKind]> = createEnvelope(message);
            envelope.addStamp<IdentityStamp>('missive:identity', { id: nanoid() });
            let index = 0;

            const next = async () => {
                if (index < middlewares.length) {
                    const middleware = middlewares[index++];
                    // we give the __type to the middleware only
                    await middleware(
                        envelope as Envelope<TypedMessage<HandlerDefinitions[MessageName][BusKind], MessageName>>,
                        next,
                    );
                } else {
                    const results = await Promise.all(handlers.map(async (handler) => await handler(envelope)));
                    results.forEach((result) =>
                        envelope.addStamp<HandledStamp<HandlerDefinitions[MessageName]['result']>>(
                            'missive:handled',
                            result,
                        ),
                    );
                }
            };

            await next();
            return envelope;
        };
    };

    const dispatch = async <MessageName extends keyof HandlerDefinitions & string>(
        message: ExtractedMessage<BusKind, HandlerDefinitions, MessageName>,
    ): Promise<{
        envelope: Envelope<HandlerDefinitions[MessageName][BusKind]>;
        result: HandlerDefinitions[MessageName]['result'] | undefined;
        results: (HandlerDefinitions[MessageName]['result'] | undefined)[];
    }> => {
        const entry = registry[message.__type];
        if (!entry) {
            throw new Error(`No handler found for type: ${message.__type}`);
        }
        const { handlers } = entry;
        const chain = createMiddlewareChain<MessageName>(handlers);
        const envelope = await chain(message);
        return {
            envelope,
            result: envelope.lastStamp<HandledStamp<HandlerDefinitions[MessageName]['result']>>('missive:handled')
                ?.body,
            results:
                envelope
                    .stampsOfType<HandledStamp<HandlerDefinitions[MessageName]['result']>>('missive:handled')
                    .map((r) => r?.body) || [],
        };
    };

    const createIntent = <MessageName extends keyof HandlerDefinitions & string>(
        type: MessageName,
        intent: HandlerDefinitions[MessageName][BusKind],
    ): ExtractedMessage<BusKind, HandlerDefinitions, MessageName> => {
        const entry = registry[type];
        if (!entry) {
            throw new Error(`No handler found for type: ${type}`);
        }
        const { schema } = entry;
        const parsed = schema.parse(intent);
        return {
            __type: type,
            ...parsed,
        };
    };
    return {
        use: useMiddleware,
        register: registerHandler,
        dispatch,
        createIntent,
    };
};

export const createCommandBus = <HandlerDefinitions extends CommandMessageRegistryType>(args?: {
    middlewares?: Middleware<'command', HandlerDefinitions>[];
    handlers?: HandlerConfig<'command', HandlerDefinitions>[];
}): MissiveCommandBus<HandlerDefinitions> => {
    const commandBus = createBus<'command', HandlerDefinitions>(args);

    return {
        use: (middleware: Middleware<'command', HandlerDefinitions>) => commandBus.use(middleware),
        useLoggerMiddleware: (...props: Parameters<typeof createLoggerMiddleware<'command', HandlerDefinitions>>) => {
            commandBus.use(createLoggerMiddleware(...props));
        },
        useLockMiddleware: (...props: Parameters<typeof createLockMiddleware<'command', HandlerDefinitions>>) => {
            commandBus.use(createLockMiddleware(...props));
        },
        useRetryerMiddleware: (...props: Parameters<typeof createRetryerMiddleware<'command', HandlerDefinitions>>) => {
            commandBus.use(createRetryerMiddleware(...props));
        },
        useWebhookMiddleware: (...props: Parameters<typeof createWebhookMiddleware<'command', HandlerDefinitions>>) => {
            commandBus.use(createWebhookMiddleware(...props));
        },
        register: commandBus.register,
        dispatch: commandBus.dispatch,
        createCommand: commandBus.createIntent,
    };
};

export const createQueryBus = <HandlerDefinitions extends QueryMessageRegistryType>(args?: {
    middlewares?: Middleware<'query', HandlerDefinitions>[];
    handlers?: HandlerConfig<'query', HandlerDefinitions>[];
}): MissiveQueryBus<HandlerDefinitions> => {
    const queryBus = createBus<'query', HandlerDefinitions>(args);

    return {
        use: (middleware: Middleware<'query', HandlerDefinitions>) => queryBus.use(middleware),
        useLoggerMiddleware: (...props: Parameters<typeof createLoggerMiddleware<'query', HandlerDefinitions>>) => {
            queryBus.use(createLoggerMiddleware(...props));
        },
        useLockMiddleware: (...props: Parameters<typeof createLockMiddleware<'query', HandlerDefinitions>>) => {
            queryBus.use(createLockMiddleware(...props));
        },
        useRetryerMiddleware: (...props: Parameters<typeof createRetryerMiddleware<'query', HandlerDefinitions>>) => {
            queryBus.use(createRetryerMiddleware(...props));
        },
        useWebhookMiddleware: (...props: Parameters<typeof createWebhookMiddleware<'query', HandlerDefinitions>>) => {
            queryBus.use(createWebhookMiddleware(...props));
        },
        useCacherMiddleware: (...props: Parameters<typeof createCacherMiddleware<HandlerDefinitions>>) => {
            queryBus.use(createCacherMiddleware(...props));
        },
        register: queryBus.register,
        dispatch: queryBus.dispatch,
        createQuery: queryBus.createIntent,
    };
};

export const createEventBus = <HandlerDefinitions extends EventMessageRegistryType>(args?: {
    middlewares?: Middleware<'event', HandlerDefinitions>[];
    handlers?: HandlerConfig<'event', HandlerDefinitions>[];
}): MissiveEventBus<HandlerDefinitions> => {
    const eventBus = createBus<'event', HandlerDefinitions>(args);
    return {
        use: (middleware: Middleware<'event', HandlerDefinitions>) => eventBus.use(middleware),
        useLoggerMiddleware: (...props: Parameters<typeof createLoggerMiddleware<'event', HandlerDefinitions>>) => {
            eventBus.use(createLoggerMiddleware(...props));
        },
        useLockMiddleware: (...props: Parameters<typeof createLockMiddleware<'event', HandlerDefinitions>>) => {
            eventBus.use(createLockMiddleware(...props));
        },
        useRetryerMiddleware: (...props: Parameters<typeof createRetryerMiddleware<'event', HandlerDefinitions>>) => {
            eventBus.use(createRetryerMiddleware(...props));
        },
        useWebhookMiddleware: (...props: Parameters<typeof createWebhookMiddleware<'event', HandlerDefinitions>>) => {
            eventBus.use(createWebhookMiddleware(...props));
        },
        register: eventBus.register,
        dispatch: eventBus.dispatch,
        createEvent: eventBus.createIntent,
    };
};
