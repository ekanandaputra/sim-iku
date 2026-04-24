-- AlterTable
ALTER TABLE `iku_formula_detail` MODIFY `left_type` ENUM('component', 'constant', 'temp', 'formula_ref') NOT NULL,
    MODIFY `right_type` ENUM('component', 'constant', 'temp', 'formula_ref') NOT NULL;
