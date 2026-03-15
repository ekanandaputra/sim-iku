/*
  Warnings:

  - The primary key for the `component_realizations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_realization` on the `component_realizations` table. All the data in the column will be lost.
  - The primary key for the `iku_results` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_result` on the `iku_results` table. All the data in the column will be lost.
  - The primary key for the `periods` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_period` on the `periods` table. All the data in the column will be lost.
  - Added the required column `id` to the `component_realizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `iku_results` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `periods` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE `component_realizations` DROP FOREIGN KEY `component_realizations_id_period_fkey`;

-- DropForeignKey
ALTER TABLE `iku_results` DROP FOREIGN KEY `iku_results_id_period_fkey`;

-- DropForeignKey
ALTER TABLE `periods` DROP FOREIGN KEY `periods_parent_id_fkey`;

-- AlterTable
ALTER TABLE `component_realizations` DROP PRIMARY KEY,
    DROP COLUMN `id_realization`,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `id_period` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `iku_results` DROP PRIMARY KEY,
    DROP COLUMN `id_result`,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `id_period` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `periods` DROP PRIMARY KEY,
    DROP COLUMN `id_period`,
    ADD COLUMN `id` VARCHAR(36) NOT NULL,
    MODIFY `parent_id` VARCHAR(36) NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `periods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `component_realizations` ADD CONSTRAINT `component_realizations_id_period_fkey` FOREIGN KEY (`id_period`) REFERENCES `periods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku_results` ADD CONSTRAINT `iku_results_id_period_fkey` FOREIGN KEY (`id_period`) REFERENCES `periods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
