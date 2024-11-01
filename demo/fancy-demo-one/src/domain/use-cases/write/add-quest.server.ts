import { faker } from '@faker-js/faker';
import { drizzle } from 'drizzle-orm/libsql';
import { Envelope, CommandHandlerDefinition } from 'missive.js';
import { z } from 'zod';
import { quests } from '~/db/schema';

type Deps = {
    db: ReturnType<typeof drizzle>;
};

export const AddQuestCommandSchema = z.object({
    title: z.string(),
});
type Command = z.infer<typeof AddQuestCommandSchema>;
type Result = Awaited<ReturnType<typeof handler>>;

export type AddQuestHandlerDefinition = CommandHandlerDefinition<'AddQuest', Command, Result>;

const handler = async (envelope: Envelope<Command>, { db }: Deps) => {
    const { title } = envelope.message;
    const quest = {
        title,
        description: `${faker.book.title()} with ${faker.music.songName()}`,
        difficulty: faker.helpers.arrayElement(['easy', 'medium', 'hard', 'epic']),
        reward: Math.floor(Math.random() * 500) + 1,
        completed: false,
    };
    const result = await db.insert(quests).values(quest);
    return {
        ...quest,
        id: result.lastInsertRowid?.toString(),
    };
};
export const createAddQuestHandler = (deps: Deps) => (query: Envelope<Command>) => handler(query, deps);
