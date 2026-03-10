/*
  Warnings:

  - You are about to drop the `component` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `iku` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `iku_component` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `iku_component` DROP FOREIGN KEY `iku_component_componentId_fkey`;

-- DropForeignKey
ALTER TABLE `iku_component` DROP FOREIGN KEY `iku_component_ikuId_fkey`;

-- DropTable
DROP TABLE `component`;

-- DropTable
DROP TABLE `iku`;

-- DropTable
DROP TABLE `iku_component`;

-- CreateTable
CREATE TABLE `ikus` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ikus_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `components` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `data_type` ENUM('number', 'percentage', 'integer') NOT NULL,
    `source_type` ENUM('database', 'api', 'manual') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `components_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mapping_component_iku` (
    `id` VARCHAR(36) NOT NULL,
    `ikuId` VARCHAR(36) NOT NULL,
    `componentId` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `mapping_component_iku_ikuId_componentId_key`(`ikuId`, `componentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iku_formula` (
    `id` VARCHAR(36) NOT NULL,
    `ikuId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `finalResultKey` VARCHAR(191) NOT NULL DEFAULT 'RESULT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iku_formula_detail` (
    `id` VARCHAR(36) NOT NULL,
    `formulaId` VARCHAR(36) NOT NULL,
    `sequence` INTEGER NOT NULL,
    `left_type` ENUM('component', 'constant', 'temp') NOT NULL,
    `left_value` VARCHAR(191) NOT NULL,
    `operator` ENUM('+', '-', '*', '/') NOT NULL,
    `right_type` ENUM('component', 'constant', 'temp') NOT NULL,
    `right_value` VARCHAR(191) NOT NULL,
    `result_key` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `iku_formula_detail_formulaId_idx`(`formulaId`),
    INDEX `iku_formula_detail_sequence_idx`(`sequence`),
    UNIQUE INDEX `iku_formula_detail_formulaId_sequence_key`(`formulaId`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mapping_component_iku` ADD CONSTRAINT `mapping_component_iku_ikuId_fkey` FOREIGN KEY (`ikuId`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mapping_component_iku` ADD CONSTRAINT `mapping_component_iku_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_formula` ADD CONSTRAINT `iku_formula_ikuId_fkey` FOREIGN KEY (`ikuId`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_formula_detail` ADD CONSTRAINT `iku_formula_detail_formulaId_fkey` FOREIGN KEY (`formulaId`) REFERENCES `iku_formula`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
