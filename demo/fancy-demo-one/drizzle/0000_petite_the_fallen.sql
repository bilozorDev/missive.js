CREATE TABLE `character_quests` (
	`characterId` integer NOT NULL,
	`questId` integer NOT NULL,
	`status` text(50) DEFAULT 'assigned' NOT NULL,
	`result` text(50),
	`completedAt` integer,
	`experienceGained` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`characterId`, `questId`),
	FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`questId`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`class` text(50) NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`strength` integer DEFAULT 5 NOT NULL,
	`agility` integer DEFAULT 5 NOT NULL,
	`magic` integer DEFAULT 5 NOT NULL,
	`experience` integer DEFAULT 0 NOT NULL,
	`retired` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`eventType` text(100) NOT NULL,
	`payload` text NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text(252) NOT NULL,
	`description` text NOT NULL,
	`difficulty` text(50) NOT NULL,
	`reward` integer DEFAULT 100 NOT NULL,
	`completed` integer DEFAULT false NOT NULL
);
