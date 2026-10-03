-- CreateTable
CREATE TABLE `iku_result_prodi` (
    `id` VARCHAR(36) NOT NULL,
    `result_id` VARCHAR(191) NOT NULL,
    `prodi_id` VARCHAR(36) NOT NULL,
    `calculated_value` DECIMAL(18, 4) NULL,
    `skipped_reason` TEXT NULL,
    `debug_info` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `iku_result_prodi_prodi_id_idx`(`prodi_id`),
    UNIQUE INDEX `iku_result_prodi_result_id_prodi_id_key`(`result_id`, `prodi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `iku_result_prodi` ADD CONSTRAINT `iku_result_prodi_result_id_fkey` FOREIGN KEY (`result_id`) REFERENCES `iku_results`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_result_prodi` ADD CONSTRAINT `iku_result_prodi_prodi_id_fkey` FOREIGN KEY (`prodi_id`) REFERENCES `prodi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

