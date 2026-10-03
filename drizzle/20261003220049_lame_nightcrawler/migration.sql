CREATE TABLE `revisions` (
	`id` text PRIMARY KEY,
	`entity_id` text NOT NULL,
	`memex_id` text NOT NULL,
	`kind` text NOT NULL,
	`text` text NOT NULL,
	`answers` text,
	`created_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT `fk_revisions_memex_id_memexes_id_fk` FOREIGN KEY (`memex_id`) REFERENCES `memexes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `revisions` (`id`, `entity_id`, `memex_id`, `kind`, `text`, `answers`, `created_at`, `deleted_at`)
SELECT `id`, `entity_id`, `memex_id`, 'memory', `text`, `answers`, `created_at`, `deleted_at` FROM `memories`;
--> statement-breakpoint
INSERT INTO `revisions` (`id`, `entity_id`, `memex_id`, `kind`, `text`, `answers`, `created_at`, `deleted_at`)
SELECT `id`, `entity_id`, `memex_id`, 'question', `text`, NULL, `created_at`, `deleted_at` FROM `questions`;
--> statement-breakpoint
DROP TABLE `memories`;--> statement-breakpoint
DROP TABLE `questions`;--> statement-breakpoint
CREATE INDEX `revisions_entity` ON `revisions` (`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `revisions_memex` ON `revisions` (`memex_id`,`kind`);--> statement-breakpoint
CREATE INDEX `revisions_answers` ON `revisions` (`answers`);
