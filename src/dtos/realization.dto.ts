import { IsInt, IsNotEmpty, IsNumber, Min, Max, IsArray, ValidateNested, IsOptional, IsString, IsObject } from "class-validator";
import { Type } from "class-transformer";

export class BulkRealizationItemDto {
  @IsInt()
  @Min(0)
  @Max(12)
  month!: number;

  /**
   * For IKU unit: percentage | number
   * For Component: always use this field
   */
  @IsOptional()
  @IsNumber({}, { message: "value must be a numeric value" })
  value?: number;

  /**
   * For IKU unit: text  → { text: "string" }
   * For IKU unit: file  → { files: [{ documentId: "uuid", name: "filename" }, ...] }
   */
  @IsOptional()
  @IsObject({ message: "metadata must be a JSON object" })
  metadata?: Record<string, any>;

  /**
   * For Component type only: attach document IDs
   */
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
