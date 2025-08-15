/*
  Warnings:

  - Added the required column `kecamatanId` to the `RT` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kelurahanId` to the `RT` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `rt` ADD COLUMN `kecamatanId` INTEGER NOT NULL,
    ADD COLUMN `kelurahanId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Kecamatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Kecamatan_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kelurahan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kecamatanId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Kelurahan_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Kelurahan` ADD CONSTRAINT `Kelurahan_kecamatanId_fkey` FOREIGN KEY (`kecamatanId`) REFERENCES `Kecamatan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RT` ADD CONSTRAINT `RT_kecamatanId_fkey` FOREIGN KEY (`kecamatanId`) REFERENCES `Kecamatan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RT` ADD CONSTRAINT `RT_kelurahanId_fkey` FOREIGN KEY (`kelurahanId`) REFERENCES `Kelurahan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
