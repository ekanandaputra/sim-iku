import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { ComponentDataType, ComponentSourceType, ComponentPeriodType } from "../generated/prisma/enums";

export class ComponentCreateDto {
  @IsNotEmpty({ message: "Code is required" })
  @IsString({ message: "Code must be a string" })
  @Length(1, 50, { message: "Code must be at most 50 characters" })
  code!: string;

  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @Length(1, 200, { message: "Name must be at most 200 characters" })
  name!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Length(0, 500, { message: "Description must be at most 500 characters" })
  description?: string;

  @IsOptional()
  @IsEnum(ComponentDataType, { message: "Data type must be one of: number, percentage, integer" })
  dataType?: ComponentDataType;

  @IsOptional()
  @IsEnum(ComponentSourceType, { message: "Source type must be one of: database, api, manual" })
  sourceType?: ComponentSourceType;

  @IsOptional()
  @IsEnum(ComponentPeriodType, { message: "Period type must be one of: monthly, quarter, semester, yearly" })
  periodType?: ComponentPeriodType;

  @IsOptional()
  @IsArray({ message: "tagIds must be an array" })
  @IsUUID(undefined, { each: true, message: "Each tagId must be a valid UUID" })
  tagIds?: string[];
}

export class ComponentUpdateDto {
  @IsNotEmpty({ message: "Code is required" })
  @IsString({ message: "Code must be a string" })
  @Length(1, 50, { message: "Code must be at most 50 characters" })
  code!: string;

  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @Length(1, 200, { message: "Name must be at most 200 characters" })
  name!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Length(0, 500, { message: "Description must be at most 500 characters" })
  description?: string;

  @IsOptional()
  @IsEnum(ComponentDataType, { message: "Data type must be one of: number, percentage, integer" })
  dataType?: ComponentDataType;

  @IsOptional()
  @IsEnum(ComponentSourceType, { message: "Source type must be one of: database, api, manual" })
  sourceType?: ComponentSourceType;

  @IsOptional()
  @IsEnum(ComponentPeriodType, { message: "Period type must be one of: monthly, quarter, semester, yearly" })
  periodType?: ComponentPeriodType;
}
