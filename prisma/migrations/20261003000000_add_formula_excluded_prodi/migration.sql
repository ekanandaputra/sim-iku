-- CreateTable
CREATE TABLE `iku_formula_excluded_prodi` (
    `formula_id` VARCHAR(36) NOT NULL,
    `prodi_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `iku_formula_excluded_prodi_prodi_id_idx`(`prodi_id`),
    PRIMARY KEY (`formula_id`, `prodi_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `iku_formula_excluded_prodi` ADD CONSTRAINT `iku_formula_excluded_prodi_formula_id_fkey` FOREIGN KEY (`formula_id`) REFERENCES `iku_formula`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_formula_excluded_prodi` ADD CONSTRAINT `iku_formula_excluded_prodi_prodi_id_fkey` FOREIGN KEY (`prodi_id`) REFERENCES `prodi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

