import { createContainer, InjectionMode, asFunction, asValue } from 'awilix';
import type { Logger } from '~/domain/contracts/logger';
import { createLogger } from '~/infrastructure/create-logger.server';
import { createCommandBus, createEventBus, createQueryBus } from 'missive.js';
import {
    CommandBus,
    CommandDefitions,
    EventBus,
    EventDefitions,
    QueryBus,
    QueryDefitions,
} from '~/domain/contracts/bus';
import { drizzle } from 'drizzle-orm/libsql';
import {
    createListAllCharacterHandler,
    ListAllCharactersQuerySchema,
} from '~/domain/use-cases/read/list-all-characters.server';
import { DefaultLogger } from 'drizzle-orm/logger';

export const buildContainer = () => {
    const logger = createLogger(['info', 'debug']);
    const dLogger = new DefaultLogger({ writer: { write: logger.debug } });
    const db = drizzle({
        connection: { url: process.env.DB_FILE_NAME! },
        logger: dLogger,
    });
    const container = createContainer<{
        logger: Logger;
        queryBus: QueryBus;
        commandBus: CommandBus;
        eventBus: EventBus;
        db: typeof db;
        listAllCharactersQueryHandler: ReturnType<typeof createListAllCharacterHandler>;
    }>({
        injectionMode: InjectionMode.PROXY,
        strict: true,
    });

    container.register({
        logger: asValue(logger),
        queryBus: asFunction(() => createQueryBus<QueryDefitions>()).singleton(),
        commandBus: asFunction(() => createCommandBus<CommandDefitions>()).singleton(),
        eventBus: asFunction(() => createEventBus<EventDefitions>()).singleton(),
        listAllCharactersQueryHandler: asFunction(createListAllCharacterHandler).singleton(),
        db: asValue(db),
    });

    // Query Bus
    const loggerAdapter = { log: container.cradle.logger.info, error: container.cradle.logger.error };
    container.cradle.queryBus.useLoggerMiddleware({ logger: loggerAdapter });
    container.cradle.queryBus.useCacherMiddleware({
        defaultTtl: 10,
    });
    container.cradle.queryBus.register(
        'ListAllCharacters',
        ListAllCharactersQuerySchema,
        container.cradle.listAllCharactersQueryHandler,
    );

    // Command Bus
    container.cradle.commandBus.useLoggerMiddleware({ logger: loggerAdapter });

    // Event Bus
    container.cradle.eventBus.useLoggerMiddleware({ logger: loggerAdapter });
    return container;
};
