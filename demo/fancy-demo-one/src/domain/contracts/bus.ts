import { QueryBus as MissiveQueryBus, CommandBus as MissiveCommandBus, EventBus as MissiveEventBus } from 'missive.js';
import { ListAllCharacterHandlerDefinition } from '../use-cases/read/list-all-characters.server';

export type QueryDefitions = ListAllCharacterHandlerDefinition;
export type QueryBus = MissiveQueryBus<QueryDefitions>;

export type CommandDefitions = any;
export type CommandBus = MissiveCommandBus<CommandDefitions>;

export type EventDefitions = any;
export type EventBus = MissiveEventBus<EventDefitions>;

export type EventStamp = {
    event: string;
};
