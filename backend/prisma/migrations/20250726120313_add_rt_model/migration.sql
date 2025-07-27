-- AlterTable
ALTER TABLE `family` ADD COLUMN `rtId` INTEGER NULL;

-- AlterTable
ALTER TABLE `resident` ADD COLUMN `rtId` INTEGER NULL;

-- CreateTable
CREATE TABLE `RT` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `address` VARCHAR(191) NULL,
    `chairperson` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `userId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RT_number_key`(`number`),
    UNIQUE INDEX `RT_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Resident` ADD CONSTRAINT `Resident_rtId_fkey` FOREIGN KEY (`rtId`) REFERENCES `RT`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RT` ADD CONSTRAINT `RT_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Family` ADD CONSTRAINT `Family_rtId_fkey` FOREIGN KEY (`rtId`) REFERENCES `RT`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
