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
exports.IkuResultUpdateDto = exports.IkuResultCreateDto = void 0;
const class_validator_1 = require("class-validator");
class IkuResultCreateDto {
}
exports.IkuResultCreateDto = IkuResultCreateDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "idIku is required" }),
    (0, class_validator_1.IsString)({ message: "idIku must be a string" }),
    __metadata("design:type", String)
], IkuResultCreateDto.prototype, "idIku", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "idPeriod is required" }),
    (0, class_validator_1.IsString)({ message: "idPeriod must be a UUID string" }),
    __metadata("design:type", String)
], IkuResultCreateDto.prototype, "idPeriod", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "calculatedValue is required" }),
    (0, class_validator_1.IsNumber)({}, { message: "calculatedValue must be numeric" }),
    __metadata("design:type", Number)
], IkuResultCreateDto.prototype, "calculatedValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "formulaVersion must be a string" }),
    __metadata("design:type", String)
], IkuResultCreateDto.prototype, "formulaVersion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: "calculatedAt must be an ISO datetime string" }),
    __metadata("design:type", String)
], IkuResultCreateDto.prototype, "calculatedAt", void 0);
class IkuResultUpdateDto {
}
exports.IkuResultUpdateDto = IkuResultUpdateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: "calculatedValue must be numeric" }),
    __metadata("design:type", Number)
], IkuResultUpdateDto.prototype, "calculatedValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "formulaVersion must be a string" }),
    __metadata("design:type", String)
], IkuResultUpdateDto.prototype, "formulaVersion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: "calculatedAt must be an ISO datetime string" }),
    __metadata("design:type", String)
], IkuResultUpdateDto.prototype, "calculatedAt", void 0);
