import { sqliteTable, int, text, primaryKey } from 'drizzle-orm/sqlite-core';

export const characters = sqliteTable('characters', {
    id: int().primaryKey({ autoIncrement: true }),
    name: text({ length: 255 }).notNull(),
    class: text({ length: 50 }).notNull(),
    level: int().notNull().default(1),
    strength: int().notNull().default(5),
    agility: int().notNull().default(5),
    magic: int().notNull().default(5),
    experience: int().notNull().default(0),
    retired: int({ mode: 'boolean' }).notNull().default(false),
});

export const quests = sqliteTable('quests', {
    id: int().primaryKey({ autoIncrement: true }),
    title: text({ length: 252 }).notNull(),
    description: text().notNull(),
    difficulty: text({ length: 50 }).notNull(),
    reward: int().notNull().default(100),
    completed: int({ mode: 'boolean' }).notNull().default(false),
});

export const characterQuests = sqliteTable(
    'character_quests',
    {
        characterId: int()
            .notNull()
            .references(() => characters.id),
        questId: int()
            .notNull()
            .references(() => quests.id),
        status: text({ length: 50 }).notNull().default('assigned'),
        result: text({ length: 50 }),
        completedAt: int(),
        experienceGained: int().notNull().default(0),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.characterId, table.questId] }),
    }),
);

export const events = sqliteTable('events', {
    id: int().primaryKey({ autoIncrement: true }),
    eventType: text({ length: 100 }).notNull(),
    payload: text().notNull(),
    timestamp: int({ mode: 'timestamp' }).notNull(),
});
