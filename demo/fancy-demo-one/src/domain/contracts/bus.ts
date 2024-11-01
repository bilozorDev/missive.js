import { QueryBus as MissiveQueryBus, CommandBus as MissiveCommandBus, EventBus as MissiveEventBus } from 'missive.js';
import { ListAllCharactersHandlerDefinition } from '../use-cases/read/list-all-characters.server';
import { AddCharacterHandlerDefinition } from '../use-cases/write/add-character.server';
import { AddQuestHandlerDefinition } from '../use-cases/write/add-quest.server';
import { ListAllQuestsHandlerDefinition } from '../use-cases/read/list-all-quests.server';

export type QueryDefitions = ListAllCharactersHandlerDefinition & ListAllQuestsHandlerDefinition;
export type QueryBus = MissiveQueryBus<QueryDefitions>;

export type CommandDefitions = AddCharacterHandlerDefinition & AddQuestHandlerDefinition;
export type CommandBus = MissiveCommandBus<CommandDefitions>;

export type EventDefitions = any;
export type EventBus = MissiveEventBus<EventDefitions>;

export type EventStamp = {
    event: string;
};
