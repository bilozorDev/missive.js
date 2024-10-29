import { CreateUserHandlerDefinition } from '../use-cases/create-user.js';
import { UserCreatedHandlerDefinition } from '../use-cases/user-created.js';
import { GetUserHandlerDefinition } from '../use-cases/get-user.js';
import { RemoveUserHandlerDefinition } from '../use-cases/remove-user.js';
import {
    QueryBus as MissiveQueryBus,
    CommandBus as MissiveCommandBus,
    EventBus as MissiveBus,
    Stamp,
} from 'missive.js';
import { UserRemovedHandlerDefinition } from '../use-cases/user-removed.js';
import { GetOrdersHandlerDefinition } from '../use-cases/get-orders.js';

export type QueryHandlerRegistry = GetUserHandlerDefinition & GetOrdersHandlerDefinition;
export type QueryBus = MissiveQueryBus<QueryHandlerRegistry>;

export type CommandHandlerRegistry = CreateUserHandlerDefinition & RemoveUserHandlerDefinition;
export type CommandBus = MissiveCommandBus<CommandHandlerRegistry>;

export type EventHandlerRegistry = UserCreatedHandlerDefinition & UserRemovedHandlerDefinition;
export type EventBus = MissiveBus<EventHandlerRegistry>;

// Events
export type UserCreatedEventStamp = Stamp<
    {
        _type: keyof UserCreatedHandlerDefinition;
        userId: string;
    },
    'event'
>;

export type UserRemovedEventStamp = Stamp<
    {
        _type: keyof UserRemovedHandlerDefinition;
        userId: string;
    },
    'event'
>;
