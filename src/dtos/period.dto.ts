import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length } from "class-validator";
import { PeriodType } from "../generated/prisma/enums";

export class PeriodCreateDto {
  @IsNotEmpty({ message: "year is required" })
  @IsInt({ message: "year must be an integer" })
  year!: number;

  @IsNotEmpty({ message: "periodType is required" })
  @IsEnum(PeriodType, { message: "periodType must be year, semester, or quarter" })
  periodType!: PeriodType;

  @IsNotEmpty({ message: "periodValue is required" })
  @IsInt({ message: "periodValue must be an integer" })
  @IsPositive({ message: "periodValue must be a positive integer" })
  periodValue!: number;

  @IsNotEmpty({ message: "periodName is required" })
  @IsString({ message: "periodName must be a string" })
  @Length(1, 120, { message: "periodName must be between 1 and 120 characters" })
  periodName!: string;

  @IsNotEmpty({ message: "level is required" })
  @IsInt({ message: "level must be an integer" })
  @IsPositive({ message: "level must be positive" })
  level!: number;

  @IsOptional()
  @IsString({ message: "parentId must be a string" })
  parentId?: string;
}

export class PeriodUpdateDto {
  @IsOptional()
  @IsInt({ message: "year must be an integer" })
  year?: number;

  @IsOptional()
  @IsEnum(PeriodType, { message: "periodType must be year, semester, or quarter" })
  periodType?: PeriodType;

  @IsOptional()
  @IsInt({ message: "periodValue must be an integer" })
  @IsPositive({ message: "periodValue must be a positive integer" })
  periodValue?: number;

  @IsOptional()
  @IsString({ message: "periodName must be a string" })
  @Length(1, 120, { message: "periodName must be between 1 and 120 characters" })
  periodName?: string;

  @IsOptional()
  @IsInt({ message: "level must be an integer" })
  @IsPositive({ message: "level must be positive" })
  level?: number;

  @IsOptional()
  @IsString({ message: "parentId must be a string" })
  parentId?: string;
}
