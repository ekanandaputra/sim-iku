-- CreateTable
CREATE TABLE `guides` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `filename` VARCHAR(191) NULL,
    `original_name` VARCHAR(191) NULL,
    `file_url` VARCHAR(191) NULL,
    `mime_type` VARCHAR(191) NULL,
    `size` INTEGER NULL,
    `video_url` VARCHAR(191) NULL,
    `video_source` ENUM('YOUTUBE', 'GOOGLE_DRIVE') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
