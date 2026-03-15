-- CreateTable
CREATE TABLE `periods` (
    `id_period` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL,
    `period_type` ENUM('year', 'semester', 'quarter') NOT NULL,
    `period_value` INTEGER NOT NULL,
    `period_name` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `parent_id` INTEGER NULL,

    INDEX `periods_parent_id_idx`(`parent_id`),
    UNIQUE INDEX `periods_year_period_type_period_value_key`(`year`, `period_type`, `period_value`),
    PRIMARY KEY (`id_period`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `component_realizations` (
    `id_realization` INTEGER NOT NULL AUTO_INCREMENT,
    `id_component` VARCHAR(191) NOT NULL,
    `id_period` INTEGER NOT NULL,
    `value` DECIMAL(18, 4) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `component_realizations_id_period_idx`(`id_period`),
    INDEX `component_realizations_id_component_idx`(`id_component`),
    UNIQUE INDEX `component_realizations_id_component_id_period_key`(`id_component`, `id_period`),
    PRIMARY KEY (`id_realization`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `periods`(`id_period`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_realizations` ADD CONSTRAINT `component_realizations_id_period_fkey` FOREIGN KEY (`id_period`) REFERENCES `periods`(`id_period`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_realizations` ADD CONSTRAINT `component_realizations_id_component_fkey` FOREIGN KEY (`id_component`) REFERENCES `components`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
