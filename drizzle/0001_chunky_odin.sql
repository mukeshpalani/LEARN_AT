CREATE TABLE `assessmentAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentType` varchar(40) NOT NULL,
	`score` int NOT NULL,
	`answersJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessmentAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competencyStates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`competencyId` varchar(80) NOT NULL,
	`name` varchar(160) NOT NULL,
	`domain` varchar(120) NOT NULL,
	`category` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`currentScore` int NOT NULL DEFAULT 0,
	`targetScore` int NOT NULL DEFAULT 75,
	`status` varchar(40) NOT NULL DEFAULT 'NOT STARTED',
	`prerequisites` text NOT NULL,
	`evidenceCount` int NOT NULL DEFAULT 0,
	`rationale` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competencyStates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`competencyId` varchar(80) NOT NULL,
	`evidenceType` varchar(80) NOT NULL,
	`score` int NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learnerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`learnerType` varchar(80) NOT NULL,
	`roleTitle` varchar(160) NOT NULL,
	`organization` varchar(200) NOT NULL,
	`experience` varchar(80) NOT NULL,
	`background` text NOT NULL,
	`domain` varchar(120) NOT NULL,
	`currentSkills` text NOT NULL,
	`interests` text NOT NULL,
	`goals` text NOT NULL,
	`workType` text NOT NULL,
	`onboardingComplete` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `learningEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topicId` varchar(80) NOT NULL,
	`competencyId` varchar(80) NOT NULL,
	`source` varchar(80) NOT NULL,
	`startedAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`timeSpent` int NOT NULL DEFAULT 0,
	`contentCovered` text NOT NULL,
	CONSTRAINT `learningEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionHash` varchar(128) NOT NULL,
	`competencyId` varchar(80) NOT NULL,
	`questionText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studyMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(240) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`storageKey` varchar(320),
	`textSnippet` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studyMaterials_id` PRIMARY KEY(`id`)
);
