import {
    createCacherMiddleware,
    createCommandBus,
    createEventBus,
    createQueryBus,
    createRetryerMiddleware,
    createWebhookMiddleware,
} from 'missive.js';
import {
    CommandBus,
    CommandHandlerRegistry,
    EventBus,
    EventHandlerRegistry,
    QueryHandlerRegistry,
} from '../domain/contracts/bus.js';
import { createEventsMiddleware } from '../domain/middlewares/events.js';
import { createLoggerMiddleware } from '../domain/middlewares/logger.js';
import { createCreateUserHandler, createUserCommandSchema } from '../domain/use-cases/create-user.js';
import { createGetUserHandler, getUserQuerySchema } from '../domain/use-cases/get-user.js';
import { createRemoveUserHandler, removeUserCommandSchema } from '../domain/use-cases/remove-user.js';
import { createUserCreatedHandler, userCreatedEventSchema } from '../domain/use-cases/user-created.js';
import { createUserCreatedHandler2 } from '../domain/use-cases/user-created2.js';
import { createUserRemovedHandler, userRemovedEventSchema } from '../domain/use-cases/user-removed.js';
import { createLoggerMiddleware as MissiveCreateLoggerMiddleware } from 'missive.js';
import { QueryBus } from '../domain/contracts/bus.js';
import { createGetOrdersHandler, getOrdersQuerySchema } from '../domain/use-cases/get-orders.js';

// Built-in Logger Middleware Adapter
const missiveLoggerMiddleware = MissiveCreateLoggerMiddleware({
    collect: false,
    async: false,
});
// Built-in Cacher Middleware Adapter
const cacherMiddleware = createCacherMiddleware<QueryHandlerRegistry>({ cache: 'all', defaultTtl: 3600 });

// Project Logger Middleware Adapter
const loggerMiddleware = createLoggerMiddleware();

const queryBus: QueryBus = createQueryBus<QueryHandlerRegistry>();
queryBus.use(missiveLoggerMiddleware);
queryBus.use(cacherMiddleware);
queryBus.use(loggerMiddleware);
queryBus.register('getUser', getUserQuerySchema, createGetUserHandler({}));
queryBus.register('getOrders', getOrdersQuerySchema, createGetOrdersHandler({}));

const eventBus: EventBus = createEventBus<EventHandlerRegistry>();
eventBus.use(missiveLoggerMiddleware);
eventBus.use(loggerMiddleware);
eventBus.register('userCreated', userCreatedEventSchema, createUserCreatedHandler({}));
eventBus.register('userCreated', userCreatedEventSchema, createUserCreatedHandler2({}));
eventBus.register('userRemoved', userRemovedEventSchema, createUserRemovedHandler({}));

const retryerMiddleware = createRetryerMiddleware();
const webhookMiddleware = createWebhookMiddleware<'command', CommandHandlerRegistry>({
    async: true,
    parallel: true,
    maxAttempts: 3,
    jitter: 0.5,
    multiplier: 1.5,
    waitingAlgorithm: 'exponential',
    fetcher: fetch,
    mapping: {
        createUser: [
            {
                url: 'https://webhook.site/c351ab7a-c4cc-4270-9872-48a2d4f67ea4',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signatureHeader: 'X-Plop-Signature',
                signature: (payload) => 'signature',
            },
        ],
    },
});
const commandBus: CommandBus = createCommandBus<CommandHandlerRegistry>({
    middlewares: [
        webhookMiddleware,
        missiveLoggerMiddleware,
        loggerMiddleware,
        createEventsMiddleware(eventBus),
        retryerMiddleware,
    ],
    handlers: [
        { messageName: 'createUser', schema: createUserCommandSchema, handler: createCreateUserHandler({}) },
        { messageName: 'removeUser', schema: removeUserCommandSchema, handler: createRemoveUserHandler({}) },
    ],
});

export { queryBus, commandBus, eventBus };
