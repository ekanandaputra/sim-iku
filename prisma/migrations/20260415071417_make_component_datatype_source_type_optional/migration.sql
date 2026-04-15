-- AlterTable
ALTER TABLE `components` MODIFY `data_type` ENUM('number', 'percentage', 'integer') NULL,
    MODIFY `source_type` ENUM('database', 'api', 'manual') NULL;
