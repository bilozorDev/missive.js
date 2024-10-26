import { createCommandBus, createEventBus, createQueryBus, LoggerAdapter } from 'missive.js';
import {
    CommandBus,
    CommandHandlerRegistry,
    EventBus,
    EventHandlerRegistry,
    QueryBus,
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

export const consoleLogger: LoggerAdapter = {
    processing: (identity, message, results, stamps) =>
        console.log(
            `Processing Envelope<${identity?.body?.id}>`,
            JSON.stringify({
                message,
                results,
                stamps,
            }),
        ),
    processed: (identity, message, results, stamps) =>
        console.log(
            `Processed Envelope<${identity?.body?.id}>`,
            JSON.stringify({
                message,
                results,
                stamps,
            }),
        ),
    error: (identity, message, results, stamps) =>
        console.error(
            `Error with Envelope<${identity?.body?.id}>`,
            JSON.stringify({
                message,
                results,
                stamps,
            }),
        ),
};

const loggerMiddleware = createLoggerMiddleware();
const missiveLoggerMiddleware = MissiveCreateLoggerMiddleware(consoleLogger, {
    collect: false,
    async: false,
});
const queryBus: QueryBus = createQueryBus<QueryHandlerRegistry>();
queryBus.use(missiveLoggerMiddleware);
queryBus.use(loggerMiddleware);
queryBus.register('getUser', getUserQuerySchema, createGetUserHandler({}));

const eventBus: EventBus = createEventBus<EventHandlerRegistry>();
eventBus.use(missiveLoggerMiddleware);
eventBus.use(loggerMiddleware);
eventBus.register('userCreated', userCreatedEventSchema, createUserCreatedHandler({}));
eventBus.register('userCreated', userCreatedEventSchema, createUserCreatedHandler2({}));
eventBus.register('userRemoved', userRemovedEventSchema, createUserRemovedHandler({}));

const commandBus: CommandBus = createCommandBus<CommandHandlerRegistry>({
    middlewares: [missiveLoggerMiddleware, loggerMiddleware, createEventsMiddleware(eventBus)],
    handlers: [
        { messageName: 'createUser', schema: createUserCommandSchema, handler: createCreateUserHandler({}) },
        { messageName: 'removeUser', schema: removeUserCommandSchema, handler: createRemoveUserHandler({}) },
    ],
});

export { queryBus, commandBus, eventBus };
