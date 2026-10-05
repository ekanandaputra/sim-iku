-- DropForeignKey
ALTER TABLE `iku_result_prodi` DROP FOREIGN KEY `iku_result_prodi_prodi_id_fkey`;

-- AddForeignKey
ALTER TABLE `iku_result_prodi` ADD CONSTRAINT `iku_result_prodi_prodi_id_fkey` FOREIGN KEY (`prodi_id`) REFERENCES `prodi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

