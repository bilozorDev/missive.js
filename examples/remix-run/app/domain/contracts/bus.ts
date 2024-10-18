import { CreateUserHandlerDefinition } from '~/domain/use-cases/create-user';
import { UserCreatedHandlerDefinition } from '~/domain/use-cases/user-created';
import { GetUserHandlerDefinition } from '~/domain/use-cases/get-user';
import { RemoveUserHandlerDefinition } from '../use-cases/remove-user';
import { Bus } from 'missive.js';
import { UserRemovedHandlerDefinition } from '../use-cases/user-removed';

export type QueryDefitions = GetUserHandlerDefinition;
export type QueryBus = Bus<'query', QueryDefitions>;

export type CommandDefitions = CreateUserHandlerDefinition & RemoveUserHandlerDefinition;
export type CommandBus = Bus<'command', CommandDefitions>;

export type EventDefitions = UserCreatedHandlerDefinition & UserRemovedHandlerDefinition;
export type EventBus = Bus<'event', EventDefitions>;

// Events
export type UserCreatedEventStamp = {
    _type: keyof UserCreatedHandlerDefinition;
    userId: string;
};

export type UserRemovedEventStamp = {
    _type: keyof UserRemovedHandlerDefinition;
    userId: string;
};
