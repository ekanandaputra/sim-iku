import { IsArray, ArrayMinSize, ValidateNested, IsString, IsNotEmpty, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class BreakdownItemDto {
  @IsNotEmpty({ message: "prodiId is required" })
  @IsString()
  prodiId!: string;

  @IsNumber({}, { message: "value must be a number" })
  @Min(0, { message: "value must be >= 0" })
  value!: number;
}

export class SaveBreakdownDto {
  @IsArray({ message: "breakdowns must be an array" })
  @ArrayMinSize(1, { message: "breakdowns must contain at least one entry" })
  @ValidateNested({ each: true })
  @Type(() => BreakdownItemDto)
  breakdowns!: BreakdownItemDto[];
}
