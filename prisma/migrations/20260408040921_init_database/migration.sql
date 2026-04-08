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
    `period_type` ENUM('monthly', 'quarter', 'semester', 'yearly') NOT NULL DEFAULT 'yearly',
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
CREATE TABLE `User` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iku_formula` (
    `id` VARCHAR(36) NOT NULL,
    `ikuId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `finalResultKey` VARCHAR(191) NOT NULL DEFAULT 'RESULT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER NOT NULL DEFAULT 1,
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

-- CreateTable
CREATE TABLE `periods` (
    `id` VARCHAR(36) NOT NULL,
    `year` INTEGER NOT NULL,
    `period_type` ENUM('year', 'semester', 'quarter') NOT NULL,
    `period_value` INTEGER NOT NULL,
    `period_name` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `parent_id` VARCHAR(36) NULL,

    INDEX `periods_parent_id_idx`(`parent_id`),
    UNIQUE INDEX `periods_year_period_type_period_value_key`(`year`, `period_type`, `period_value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `component_realizations` (
    `id` VARCHAR(36) NOT NULL,
    `id_component` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `value` DECIMAL(18, 4) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `component_realizations_id_component_idx`(`id_component`),
    UNIQUE INDEX `component_realizations_id_component_month_year_key`(`id_component`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iku_results` (
    `id` VARCHAR(36) NOT NULL,
    `id_iku` VARCHAR(191) NOT NULL,
    `id_period` VARCHAR(36) NOT NULL,
    `calculated_value` DECIMAL(18, 4) NOT NULL,
    `formula_version` VARCHAR(191) NULL,
    `calculated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `iku_results_id_iku_idx`(`id_iku`),
    INDEX `iku_results_id_period_idx`(`id_period`),
    UNIQUE INDEX `iku_results_id_iku_id_period_key`(`id_iku`, `id_period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iku_targets` (
    `id` VARCHAR(36) NOT NULL,
    `iku_id` VARCHAR(36) NOT NULL,
    `year` INTEGER NOT NULL,
    `target_q1` DECIMAL(18, 4) NULL,
    `target_q2` DECIMAL(18, 4) NULL,
    `target_q3` DECIMAL(18, 4) NULL,
    `target_q4` DECIMAL(18, 4) NULL,
    `target_year` DECIMAL(18, 4) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `iku_targets_iku_id_year_key`(`iku_id`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `component_targets` (
    `id` VARCHAR(36) NOT NULL,
    `component_id` VARCHAR(36) NOT NULL,
    `year` INTEGER NOT NULL,
    `target_q1` DECIMAL(18, 4) NULL,
    `target_q2` DECIMAL(18, 4) NULL,
    `target_q3` DECIMAL(18, 4) NULL,
    `target_q4` DECIMAL(18, 4) NULL,
    `target_year` DECIMAL(18, 4) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `component_targets_component_id_year_key`(`component_id`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(36) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `size` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `component_documents` (
    `id` VARCHAR(36) NOT NULL,
    `component_id` VARCHAR(36) NOT NULL,
    `document_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `component_documents_component_id_document_id_key`(`component_id`, `document_id`),
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

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `periods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_realizations` ADD CONSTRAINT `component_realizations_id_component_fkey` FOREIGN KEY (`id_component`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_results` ADD CONSTRAINT `iku_results_id_iku_fkey` FOREIGN KEY (`id_iku`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_results` ADD CONSTRAINT `iku_results_id_period_fkey` FOREIGN KEY (`id_period`) REFERENCES `periods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_targets` ADD CONSTRAINT `iku_targets_iku_id_fkey` FOREIGN KEY (`iku_id`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_targets` ADD CONSTRAINT `component_targets_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_documents` ADD CONSTRAINT `component_documents_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_documents` ADD CONSTRAINT `component_documents_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
