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

-- AddForeignKey
ALTER TABLE `iku_targets` ADD CONSTRAINT `iku_targets_iku_id_fkey` FOREIGN KEY (`iku_id`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_targets` ADD CONSTRAINT `component_targets_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
