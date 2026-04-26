ALTER TABLE `verifications` ADD `txHash` varchar(128);--> statement-breakpoint
ALTER TABLE `verifications` ADD `cosmosAddress` varchar(128);--> statement-breakpoint
ALTER TABLE `verifications` ADD `anchoredAt` timestamp;