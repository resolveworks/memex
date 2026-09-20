CREATE TABLE `memexes` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`language` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` text PRIMARY KEY,
	`memex_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_memories_memex_id_memexes_id_fk` FOREIGN KEY (`memex_id`) REFERENCES `memexes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY,
	`memex_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_requests_memex_id_memexes_id_fk` FOREIGN KEY (`memex_id`) REFERENCES `memexes`(`id`) ON DELETE CASCADE
);
