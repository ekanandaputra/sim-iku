/*
  Warnings:

  - The primary key for the `component_realizations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `iku_results` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `component_realizations` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `iku_results` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);
