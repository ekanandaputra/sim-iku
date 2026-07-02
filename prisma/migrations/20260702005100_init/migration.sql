-- CreateTable
CREATE TABLE `ikus` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('IKU_UTAMA', 'IKU_SPEKTA') NOT NULL DEFAULT 'IKU_SPEKTA',
    `is_direct_input` BOOLEAN NOT NULL DEFAULT false,
    `unit` ENUM('percentage', 'text', 'number', 'file') NOT NULL DEFAULT 'percentage',
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
    `data_type` ENUM('number', 'percentage', 'integer') NULL,
    `source_type` ENUM('database', 'api', 'manual') NULL,
    `period_type` ENUM('monthly', 'quarter', 'semester', 'yearly') NOT NULL DEFAULT 'yearly',
    `aggregation_type` ENUM('SUM', 'LAST') NOT NULL DEFAULT 'LAST',
    `has_breakdown` BOOLEAN NOT NULL DEFAULT false,
    `filter_by_level` BOOLEAN NOT NULL DEFAULT false,
    `parent_id` VARCHAR(36) NULL,
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
    `is_final` BOOLEAN NOT NULL DEFAULT false,
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
    `left_type` ENUM('component', 'constant', 'temp', 'formula_ref') NOT NULL,
    `left_value` VARCHAR(191) NOT NULL,
    `operator` ENUM('+', '-', '*', '/') NOT NULL,
    `right_type` ENUM('component', 'constant', 'temp', 'formula_ref') NOT NULL,
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
CREATE TABLE `component_realizations` (
    `id` VARCHAR(36) NOT NULL,
    `id_component` VARCHAR(191) NOT NULL,
    `month` INTEGER NULL,
    `year` INTEGER NOT NULL,
    `value` DECIMAL(18, 4) NOT NULL,
    `narrative` TEXT NULL,
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
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `result_type` ENUM('monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
    `quarter` INTEGER NULL,
    `calculated_value` DECIMAL(18, 4) NULL,
    `text_value` TEXT NULL,
    `narrative` TEXT NULL,
    `document_ids` JSON NULL,
    `metadata` JSON NULL,
    `debug_info` JSON NULL,
    `formula_version` VARCHAR(191) NULL,
    `calculated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `iku_results_id_iku_idx`(`id_iku`),
    INDEX `iku_results_year_idx`(`year`),
    INDEX `iku_results_month_idx`(`month`),
    INDEX `iku_results_result_type_idx`(`result_type`),
    UNIQUE INDEX `iku_results_id_iku_month_year_result_type_key`(`id_iku`, `month`, `year`, `result_type`),
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

-- CreateTable
CREATE TABLE `tags` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(7) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `component_tags` (
    `id` VARCHAR(36) NOT NULL,
    `component_id` VARCHAR(36) NOT NULL,
    `tag_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `component_tags_component_id_tag_id_key`(`component_id`, `tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `component_realization_documents` (
    `id` VARCHAR(36) NOT NULL,
    `realization_id` VARCHAR(36) NOT NULL,
    `document_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `component_realization_documents_realization_id_document_id_key`(`realization_id`, `document_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `component_users` (
    `id` VARCHAR(36) NOT NULL,
    `component_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `prodi_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `component_users_component_id_user_id_prodi_id_key`(`component_id`, `user_id`, `prodi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iku_users` (
    `id` VARCHAR(36) NOT NULL,
    `iku_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `iku_users_iku_id_user_id_key`(`iku_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prodi` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prodi_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `component_realization_breakdowns` (
    `id` VARCHAR(36) NOT NULL,
    `realization_id` VARCHAR(36) NOT NULL,
    `prodi_id` VARCHAR(36) NOT NULL,
    `value` DECIMAL(18, 4) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `component_realization_breakdowns_realization_id_idx`(`realization_id`),
    UNIQUE INDEX `component_realization_breakdowns_realization_id_prodi_id_key`(`realization_id`, `prodi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bidang` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bidang_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bidang_users` (
    `id` VARCHAR(36) NOT NULL,
    `bidang_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bidang_users_bidang_id_user_id_key`(`bidang_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bidang_iku` (
    `id` VARCHAR(36) NOT NULL,
    `bidang_id` VARCHAR(36) NOT NULL,
    `iku_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bidang_iku_bidang_id_iku_id_key`(`bidang_id`, `iku_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bidang_components` (
    `id` VARCHAR(36) NOT NULL,
    `bidang_id` VARCHAR(36) NOT NULL,
    `component_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bidang_components_bidang_id_component_id_key`(`bidang_id`, `component_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `entity_type` ENUM('IKU', 'COMPONENT', 'COMPONENT_REALIZATION', 'IKU_RESULT') NOT NULL,
    `entity_id` VARCHAR(36) NOT NULL,
    `entity_code` VARCHAR(100) NULL,
    `entity_name` VARCHAR(255) NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `components` ADD CONSTRAINT `components_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `components`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mapping_component_iku` ADD CONSTRAINT `mapping_component_iku_ikuId_fkey` FOREIGN KEY (`ikuId`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mapping_component_iku` ADD CONSTRAINT `mapping_component_iku_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_formula` ADD CONSTRAINT `iku_formula_ikuId_fkey` FOREIGN KEY (`ikuId`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_formula_detail` ADD CONSTRAINT `iku_formula_detail_formulaId_fkey` FOREIGN KEY (`formulaId`) REFERENCES `iku_formula`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_realizations` ADD CONSTRAINT `component_realizations_id_component_fkey` FOREIGN KEY (`id_component`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_results` ADD CONSTRAINT `iku_results_id_iku_fkey` FOREIGN KEY (`id_iku`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_targets` ADD CONSTRAINT `iku_targets_iku_id_fkey` FOREIGN KEY (`iku_id`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_targets` ADD CONSTRAINT `component_targets_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_documents` ADD CONSTRAINT `component_documents_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_documents` ADD CONSTRAINT `component_documents_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_tags` ADD CONSTRAINT `component_tags_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_tags` ADD CONSTRAINT `component_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_realization_documents` ADD CONSTRAINT `component_realization_documents_realization_id_fkey` FOREIGN KEY (`realization_id`) REFERENCES `component_realizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_realization_documents` ADD CONSTRAINT `component_realization_documents_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_users` ADD CONSTRAINT `component_users_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_users` ADD CONSTRAINT `component_users_prodi_id_fkey` FOREIGN KEY (`prodi_id`) REFERENCES `prodi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_users` ADD CONSTRAINT `iku_users_iku_id_fkey` FOREIGN KEY (`iku_id`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_realization_breakdowns` ADD CONSTRAINT `component_realization_breakdowns_realization_id_fkey` FOREIGN KEY (`realization_id`) REFERENCES `component_realizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_realization_breakdowns` ADD CONSTRAINT `component_realization_breakdowns_prodi_id_fkey` FOREIGN KEY (`prodi_id`) REFERENCES `prodi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bidang_users` ADD CONSTRAINT `bidang_users_bidang_id_fkey` FOREIGN KEY (`bidang_id`) REFERENCES `bidang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bidang_iku` ADD CONSTRAINT `bidang_iku_bidang_id_fkey` FOREIGN KEY (`bidang_id`) REFERENCES `bidang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bidang_iku` ADD CONSTRAINT `bidang_iku_iku_id_fkey` FOREIGN KEY (`iku_id`) REFERENCES `ikus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bidang_components` ADD CONSTRAINT `bidang_components_bidang_id_fkey` FOREIGN KEY (`bidang_id`) REFERENCES `bidang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bidang_components` ADD CONSTRAINT `bidang_components_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
