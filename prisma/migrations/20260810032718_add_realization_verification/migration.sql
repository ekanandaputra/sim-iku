-- CreateTable
CREATE TABLE `realization_verifications` (
    `id` VARCHAR(36) NOT NULL,
    `entity_type` ENUM('COMPONENT_REALIZATION', 'IKU_RESULT') NOT NULL,
    `entity_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `user_name` VARCHAR(255) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `realization_verifications_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `realization_verifications_user_id_idx`(`user_id`),
    UNIQUE INDEX `realization_verifications_entity_type_entity_id_user_id_key`(`entity_type`, `entity_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
