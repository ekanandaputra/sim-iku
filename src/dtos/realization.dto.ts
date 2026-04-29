import { IsInt, IsNotEmpty, IsNumber, Min, Max, IsArray, ValidateNested, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class BulkRealizationItemDto {
  @IsInt()
  @Min(0)
  @Max(12)
  month!: number;

  @IsNumber({}, { message: "value must be a numeric value" })
  value!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];
}

export class BulkSaveRealizationDto {
  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  year!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkRealizationItemDto)
  realizations!: BulkRealizationItemDto[];
}
