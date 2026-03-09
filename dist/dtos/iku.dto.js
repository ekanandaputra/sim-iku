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
exports.IkuComponentMappingDto = exports.IkuUpdateDto = exports.IkuCreateDto = void 0;
const class_validator_1 = require("class-validator");
class IkuCreateDto {
}
exports.IkuCreateDto = IkuCreateDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Code is required" }),
    (0, class_validator_1.IsString)({ message: "Code must be a string" }),
    (0, class_validator_1.Length)(1, 50, { message: "Code must be at most 50 characters" }),
    __metadata("design:type", String)
], IkuCreateDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Name is required" }),
    (0, class_validator_1.IsString)({ message: "Name must be a string" }),
    (0, class_validator_1.Length)(1, 200, { message: "Name must be at most 200 characters" }),
    __metadata("design:type", String)
], IkuCreateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "Description must be a string" }),
    (0, class_validator_1.Length)(0, 500, { message: "Description must be at most 500 characters" }),
    __metadata("design:type", String)
], IkuCreateDto.prototype, "description", void 0);
class IkuUpdateDto {
}
exports.IkuUpdateDto = IkuUpdateDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Code is required" }),
    (0, class_validator_1.IsString)({ message: "Code must be a string" }),
    (0, class_validator_1.Length)(1, 50, { message: "Code must be at most 50 characters" }),
    __metadata("design:type", String)
], IkuUpdateDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Name is required" }),
    (0, class_validator_1.IsString)({ message: "Name must be a string" }),
    (0, class_validator_1.Length)(1, 200, { message: "Name must be at most 200 characters" }),
    __metadata("design:type", String)
], IkuUpdateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "Description must be a string" }),
    (0, class_validator_1.Length)(0, 500, { message: "Description must be at most 500 characters" }),
    __metadata("design:type", String)
], IkuUpdateDto.prototype, "description", void 0);
class IkuComponentMappingDto {
}
exports.IkuComponentMappingDto = IkuComponentMappingDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Component ID is required" }),
    (0, class_validator_1.IsUUID)("4", { message: "Component ID must be a valid UUID" }),
    __metadata("design:type", String)
], IkuComponentMappingDto.prototype, "componentId", void 0);
