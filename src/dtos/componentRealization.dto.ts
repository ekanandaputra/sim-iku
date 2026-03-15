import { IsDecimal, IsInt, IsNotEmpty, IsNumber, Min } from "class-validator";

export class ComponentRealizationCreateDto {
  @IsNotEmpty({ message: "idComponent is required" })
  @IsNotEmpty()
  idComponent!: string;

  @IsNotEmpty({ message: "idPeriod is required" })
  @IsInt({ message: "idPeriod must be an integer" })
  idPeriod!: number;

  @IsNotEmpty({ message: "value is required" })
  @IsNumber({}, { message: "value must be a numeric value" })
  value!: number;
}

export class ComponentRealizationUpdateDto {
  @IsNotEmpty({ message: "value is required" })
  @IsNumber({}, { message: "value must be a numeric value" })
  value!: number;
}
