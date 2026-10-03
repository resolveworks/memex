PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_revisions` (
	`seq` integer PRIMARY KEY AUTOINCREMENT,
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
INSERT INTO `__new_revisions`(`entity_id`, `memex_id`, `kind`, `text`, `answers`, `created_at`, `deleted_at`) SELECT `entity_id`, `memex_id`, `kind`, `text`, `answers`, `created_at`, `deleted_at` FROM `revisions` ORDER BY `created_at`, `rowid`;--> statement-breakpoint
DROP TABLE `revisions`;--> statement-breakpoint
ALTER TABLE `__new_revisions` RENAME TO `revisions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `revisions_entity` ON `revisions` (`entity_id`,`seq`);--> statement-breakpoint
CREATE INDEX `revisions_memex` ON `revisions` (`memex_id`,`kind`);--> statement-breakpoint
CREATE INDEX `revisions_answers` ON `revisions` (`answers`);
