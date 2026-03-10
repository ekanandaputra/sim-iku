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
exports.IkuFormulaDetailUpdateDto = exports.IkuFormulaDetailCreateDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../generated/prisma/enums");
class IkuFormulaDetailCreateDto {
}
exports.IkuFormulaDetailCreateDto = IkuFormulaDetailCreateDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Sequence is required" }),
    (0, class_validator_1.IsInt)({ message: "Sequence must be an integer" }),
    (0, class_validator_1.Min)(1, { message: "Sequence must be at least 1" }),
    __metadata("design:type", Number)
], IkuFormulaDetailCreateDto.prototype, "sequence", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Left operand type is required" }),
    (0, class_validator_1.IsEnum)(enums_1.FormulaOperandType, { message: "Left operand type is invalid" }),
    __metadata("design:type", String)
], IkuFormulaDetailCreateDto.prototype, "leftType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Left operand value is required" }),
    (0, class_validator_1.IsString)({ message: "Left operand value must be a string" }),
    __metadata("design:type", String)
], IkuFormulaDetailCreateDto.prototype, "leftValue", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Operator is required" }),
    (0, class_validator_1.IsEnum)(enums_1.FormulaOperator, { message: "Operator is invalid" }),
    __metadata("design:type", String)
], IkuFormulaDetailCreateDto.prototype, "operator", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Right operand type is required" }),
    (0, class_validator_1.IsEnum)(enums_1.FormulaOperandType, { message: "Right operand type is invalid" }),
    __metadata("design:type", String)
], IkuFormulaDetailCreateDto.prototype, "rightType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Right operand value is required" }),
    (0, class_validator_1.IsString)({ message: "Right operand value must be a string" }),
    __metadata("design:type", String)
], IkuFormulaDetailCreateDto.prototype, "rightValue", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Result key is required" }),
    (0, class_validator_1.IsString)({ message: "Result key must be a string" }),
    __metadata("design:type", String)
], IkuFormulaDetailCreateDto.prototype, "resultKey", void 0);
class IkuFormulaDetailUpdateDto {
}
exports.IkuFormulaDetailUpdateDto = IkuFormulaDetailUpdateDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Sequence is required" }),
    (0, class_validator_1.IsInt)({ message: "Sequence must be an integer" }),
    (0, class_validator_1.Min)(1, { message: "Sequence must be at least 1" }),
    __metadata("design:type", Number)
], IkuFormulaDetailUpdateDto.prototype, "sequence", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Left operand type is required" }),
    (0, class_validator_1.IsEnum)(enums_1.FormulaOperandType, { message: "Left operand type is invalid" }),
    __metadata("design:type", String)
], IkuFormulaDetailUpdateDto.prototype, "leftType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Left operand value is required" }),
    (0, class_validator_1.IsString)({ message: "Left operand value must be a string" }),
    __metadata("design:type", String)
], IkuFormulaDetailUpdateDto.prototype, "leftValue", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Operator is required" }),
    (0, class_validator_1.IsEnum)(enums_1.FormulaOperator, { message: "Operator is invalid" }),
    __metadata("design:type", String)
], IkuFormulaDetailUpdateDto.prototype, "operator", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Right operand type is required" }),
    (0, class_validator_1.IsEnum)(enums_1.FormulaOperandType, { message: "Right operand type is invalid" }),
    __metadata("design:type", String)
], IkuFormulaDetailUpdateDto.prototype, "rightType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Right operand value is required" }),
    (0, class_validator_1.IsString)({ message: "Right operand value must be a string" }),
    __metadata("design:type", String)
], IkuFormulaDetailUpdateDto.prototype, "rightValue", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Result key is required" }),
    (0, class_validator_1.IsString)({ message: "Result key must be a string" }),
    __metadata("design:type", String)
], IkuFormulaDetailUpdateDto.prototype, "resultKey", void 0);
