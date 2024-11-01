import { drizzle } from 'drizzle-orm/libsql';
import { Envelope, QueryHandlerDefinition } from 'missive.js';
import { z } from 'zod';
import { quests } from '~/db/schema';

type Deps = {
    db: ReturnType<typeof drizzle>;
};

export const ListAllQuestsQuerySchema = z.object({});
type Query = z.infer<typeof ListAllQuestsQuerySchema>;
type Result = Awaited<ReturnType<typeof handler>>;

export type ListAllQuestsHandlerDefinition = QueryHandlerDefinition<'ListAllQuests', Query, Result>;

const handler = async (envelope: Envelope<Query>, { db }: Deps) => {
    const items = await db.select().from(quests).all();
    return items;
};
export const createListAllQuestsHandler = (deps: Deps) => (query: Envelope<Query>) => handler(query, deps);
