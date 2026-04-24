import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, Length, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { IkuFormulaDetailCreateDto } from "./ikuFormulaDetail.dto";

export class IkuFormulaCreateDto {
  @IsNotEmpty({ message: "IKU ID is required" })
  @IsUUID("4", { message: "IKU ID must be a valid UUID" })
  ikuId!: string;

  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @Length(1, 200, { message: "Name must be at most 200 characters" })
  name!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Length(0, 500, { message: "Description must be at most 500 characters" })
  description?: string;

  @IsOptional()
  @IsString({ message: "Final result key must be a string" })
  @Length(1, 100, { message: "Final result key must be at most 100 characters" })
  finalResultKey?: string;

  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: "isFinal must be a boolean" })
  isFinal?: boolean;

  @IsOptional()
  @IsArray({ message: "Steps must be an array" })
  @ValidateNested({ each: true })
  @Type(() => IkuFormulaDetailCreateDto)
  steps?: IkuFormulaDetailCreateDto[];
}

export class IkuFormulaUpdateDto {
  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @Length(1, 200, { message: "Name must be at most 200 characters" })
  name!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Length(0, 500, { message: "Description must be at most 500 characters" })
  description?: string;

  @IsOptional()
  @IsString({ message: "Final result key must be a string" })
  @Length(1, 100, { message: "Final result key must be at most 100 characters" })
  finalResultKey?: string;

  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: "isFinal must be a boolean" })
  isFinal?: boolean;

  @IsOptional()
  @IsArray({ message: "Steps must be an array" })
  @ValidateNested({ each: true })
  @Type(() => IkuFormulaDetailCreateDto)
  steps?: IkuFormulaDetailCreateDto[];
}
