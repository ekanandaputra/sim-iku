-- CreateTable
CREATE TABLE `realization_period_locks` (
    `id` VARCHAR(36) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `reason` TEXT NULL,
    `allow_admin_bypass` BOOLEAN NOT NULL DEFAULT false,
    `locked_by` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `realization_period_locks_month_year_key`(`month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
