-- CreateTable
CREATE TABLE `unit_iku` (
    `id` VARCHAR(36) NOT NULL,
    `unit_id` VARCHAR(36) NOT NULL,
    `iku_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `unit_iku_unit_id_iku_id_key`(`unit_id`, `iku_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `unit_iku` ADD CONSTRAINT `unit_iku_iku_id_fkey` FOREIGN KEY (`iku_id`) REFERENCES `ikus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
