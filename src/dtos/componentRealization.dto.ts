import { IsDecimal, IsInt, IsNotEmpty, IsNumber, Min, Max, IsString } from "class-validator";

export class ComponentRealizationCreateDto {
  @IsNotEmpty({ message: "idComponent is required" })
  @IsString()
  idComponent!: string;

  @IsNotEmpty({ message: "month is required" })
  @IsInt({ message: "month must be an integer" })
  @Min(1)
  @Max(12)
  month!: number;

  @IsNotEmpty({ message: "year is required" })
  @IsInt({ message: "year must be an integer" })
  @Min(2000)
  year!: number;

  @IsNotEmpty({ message: "value is required" })
  @IsNumber({}, { message: "value must be a numeric value" })
  value!: number;
}

export class ComponentRealizationUpdateDto {
  @IsNotEmpty({ message: "value is required" })
  @IsNumber({}, { message: "value must be a numeric value" })
  value!: number;
}
