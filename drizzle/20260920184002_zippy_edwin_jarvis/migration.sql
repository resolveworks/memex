CREATE TABLE `memexes` (
	`id` text PRIMARY KEY,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`memex_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `memories_pk` PRIMARY KEY(`memex_id`, `key`),
	CONSTRAINT `fk_memories_memex_id_memexes_id_fk` FOREIGN KEY (`memex_id`) REFERENCES `memexes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY,
	`memex_id` text NOT NULL,
	`question` text NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT `fk_requests_memex_id_memexes_id_fk` FOREIGN KEY (`memex_id`) REFERENCES `memexes`(`id`) ON DELETE CASCADE
);
