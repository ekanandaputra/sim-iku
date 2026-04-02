"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeriodUpdateDto = exports.PeriodCreateDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../generated/prisma/enums");
class PeriodCreateDto {
}
exports.PeriodCreateDto = PeriodCreateDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "year is required" }),
    (0, class_validator_1.IsInt)({ message: "year must be an integer" }),
    __metadata("design:type", Number)
], PeriodCreateDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "periodType is required" }),
    (0, class_validator_1.IsEnum)(enums_1.PeriodType, { message: "periodType must be year, semester, or quarter" }),
    __metadata("design:type", String)
], PeriodCreateDto.prototype, "periodType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "periodValue is required" }),
    (0, class_validator_1.IsInt)({ message: "periodValue must be an integer" }),
    (0, class_validator_1.IsPositive)({ message: "periodValue must be a positive integer" }),
    __metadata("design:type", Number)
], PeriodCreateDto.prototype, "periodValue", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "periodName is required" }),
    (0, class_validator_1.IsString)({ message: "periodName must be a string" }),
    (0, class_validator_1.Length)(1, 120, { message: "periodName must be between 1 and 120 characters" }),
    __metadata("design:type", String)
], PeriodCreateDto.prototype, "periodName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "level is required" }),
    (0, class_validator_1.IsInt)({ message: "level must be an integer" }),
    (0, class_validator_1.IsPositive)({ message: "level must be positive" }),
    __metadata("design:type", Number)
], PeriodCreateDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "parentId must be a string" }),
    __metadata("design:type", String)
], PeriodCreateDto.prototype, "parentId", void 0);
class PeriodUpdateDto {
}
exports.PeriodUpdateDto = PeriodUpdateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: "year must be an integer" }),
    __metadata("design:type", Number)
], PeriodUpdateDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.PeriodType, { message: "periodType must be year, semester, or quarter" }),
    __metadata("design:type", String)
], PeriodUpdateDto.prototype, "periodType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: "periodValue must be an integer" }),
    (0, class_validator_1.IsPositive)({ message: "periodValue must be a positive integer" }),
    __metadata("design:type", Number)
], PeriodUpdateDto.prototype, "periodValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "periodName must be a string" }),
    (0, class_validator_1.Length)(1, 120, { message: "periodName must be between 1 and 120 characters" }),
    __metadata("design:type", String)
], PeriodUpdateDto.prototype, "periodName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: "level must be an integer" }),
    (0, class_validator_1.IsPositive)({ message: "level must be positive" }),
    __metadata("design:type", Number)
], PeriodUpdateDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "parentId must be a string" }),
    __metadata("design:type", String)
], PeriodUpdateDto.prototype, "parentId", void 0);
