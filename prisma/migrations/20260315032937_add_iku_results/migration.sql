-- CreateTable
CREATE TABLE `iku_results` (
    `id_result` INTEGER NOT NULL AUTO_INCREMENT,
    `id_iku` VARCHAR(191) NOT NULL,
    `id_period` INTEGER NOT NULL,
    `calculated_value` DECIMAL(18, 4) NOT NULL,
    `formula_version` VARCHAR(191) NULL,
    `calculated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `iku_results_id_iku_idx`(`id_iku`),
    INDEX `iku_results_id_period_idx`(`id_period`),
    UNIQUE INDEX `iku_results_id_iku_id_period_key`(`id_iku`, `id_period`),
    PRIMARY KEY (`id_result`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `iku_results` ADD CONSTRAINT `iku_results_id_iku_fkey` FOREIGN KEY (`id_iku`) REFERENCES `ikus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_results` ADD CONSTRAINT `iku_results_id_period_fkey` FOREIGN KEY (`id_period`) REFERENCES `periods`(`id_period`) ON DELETE RESTRICT ON UPDATE CASCADE;
