CREATE TABLE `__new_memories` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`memex_id` text NOT NULL,
	`text` text NOT NULL,
	`answers` text,
	`created_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT `fk_memories_memex_id_memexes_id_fk` FOREIGN KEY (`memex_id`) REFERENCES `memexes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_memories` (`id`, `entity_id`, `memex_id`, `text`, `answers`, `created_at`, `deleted_at`)
SELECT `id`, `id`, `memex_id`, `text`, NULL, `created_at`, `deleted_at` FROM `memories`;
--> statement-breakpoint
DROP TABLE `memories`;
--> statement-breakpoint
ALTER TABLE `__new_memories` RENAME TO `memories`;
--> statement-breakpoint
CREATE INDEX `memories_entity` ON `memories` (`entity_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `memories_memex` ON `memories` (`memex_id`);
--> statement-breakpoint
CREATE INDEX `memories_answers` ON `memories` (`answers`);
--> statement-breakpoint
CREATE TABLE `__new_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`memex_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT `fk_requests_memex_id_memexes_id_fk` FOREIGN KEY (`memex_id`) REFERENCES `memexes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_questions` (`id`, `entity_id`, `memex_id`, `text`, `created_at`, `deleted_at`)
SELECT `id`, `id`, `memex_id`, `text`, `created_at`, `deleted_at` FROM `questions`;
--> statement-breakpoint
DROP TABLE `questions`;
--> statement-breakpoint
ALTER TABLE `__new_questions` RENAME TO `questions`;
--> statement-breakpoint
CREATE INDEX `questions_entity` ON `questions` (`entity_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `questions_memex` ON `questions` (`memex_id`);
