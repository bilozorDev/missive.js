import { faker } from '@faker-js/faker';
import { drizzle } from 'drizzle-orm/libsql';
import { Envelope, CommandHandlerDefinition } from 'missive.js';
import { z } from 'zod';
import { characters } from '~/db/schema';

type Deps = {
    db: ReturnType<typeof drizzle>;
};

export const AddCharacterCommandSchema = z.object({
    name: z.string(),
});
type Command = z.infer<typeof AddCharacterCommandSchema>;
type Result = Awaited<ReturnType<typeof handler>>;

export type AddCharacterHandlerDefinition = CommandHandlerDefinition<'AddCharacter', Command, Result>;

const handler = async (envelope: Envelope<Command>, { db }: Deps) => {
    const { name } = envelope.message;
    const type = faker.helpers.arrayElement([
        'bear',
        'bird',
        'cat',
        'dog',
        'cetacean',
        'cow',
        'crocodilia',
        'dog',
        'fish',
        'horse',
        'rabbit',
        'snake',
        'rodent',
        'insect',
    ]);

    const characterClass = faker.animal[type]();
    const character = {
        name,
        class: characterClass,
        agility: Math.floor(Math.random() * 50) + 1,
        strength: Math.floor(Math.random() * 50) + 1,
        magic: Math.floor(Math.random() * 50) + 1,
        level: 1,
        experience: 0,
        retired: false,
    };
    const result = await db.insert(characters).values(character);
    return {
        ...character,
        id: result.lastInsertRowid?.toString(),
    };
};
export const createAddCharacterHandler = (deps: Deps) => (query: Envelope<Command>) => handler(query, deps);
