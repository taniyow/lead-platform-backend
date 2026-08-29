-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brokers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `dailyCap` INTEGER NOT NULL,
    `timezone` VARCHAR(191) NOT NULL,
    `openingTime` VARCHAR(191) NOT NULL,
    `closingTime` VARCHAR(191) NOT NULL,
    `workingDays` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `singletonKey` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `forms_slug_key`(`slug`),
    UNIQUE INDEX `forms_singletonKey_key`(`singletonKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `distributions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formId` INTEGER NOT NULL,
    `singletonKey` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `distributions_formId_key`(`formId`),
    UNIQUE INDEX `distributions_singletonKey_key`(`singletonKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `distribution_brokers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `distributionId` INTEGER NOT NULL,
    `brokerId` INTEGER NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `distribution_brokers_distributionId_brokerId_key`(`distributionId`, `brokerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `normalizedEmail` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `formId` INTEGER NOT NULL,
    `distributionId` INTEGER NULL,
    `assignedBrokerId` INTEGER NULL,
    `status` ENUM('sent', 'unsent', 'duplicate', 'failed') NOT NULL,
    `assignedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `leads_normalizedEmail_idx`(`normalizedEmail`),
    INDEX `leads_createdAt_idx`(`createdAt`),
    INDEX `leads_assignedBrokerId_assignedAt_idx`(`assignedBrokerId`, `assignedAt`),
    INDEX `leads_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `distributions` ADD CONSTRAINT `distributions_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distribution_brokers` ADD CONSTRAINT `distribution_brokers_distributionId_fkey` FOREIGN KEY (`distributionId`) REFERENCES `distributions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distribution_brokers` ADD CONSTRAINT `distribution_brokers_brokerId_fkey` FOREIGN KEY (`brokerId`) REFERENCES `brokers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_distributionId_fkey` FOREIGN KEY (`distributionId`) REFERENCES `distributions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_assignedBrokerId_fkey` FOREIGN KEY (`assignedBrokerId`) REFERENCES `brokers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
