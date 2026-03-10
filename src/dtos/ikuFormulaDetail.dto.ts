import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsEnum,
} from "class-validator";
import { FormulaOperandType, FormulaOperator } from "../generated/prisma/enums";

export class IkuFormulaDetailCreateDto {
  @IsNotEmpty({ message: "Sequence is required" })
  @IsInt({ message: "Sequence must be an integer" })
  @Min(1, { message: "Sequence must be at least 1" })
  sequence!: number;

  @IsNotEmpty({ message: "Left operand type is required" })
  @IsEnum(FormulaOperandType, { message: "Left operand type is invalid" })
  leftType!: FormulaOperandType;

  @IsNotEmpty({ message: "Left operand value is required" })
  @IsString({ message: "Left operand value must be a string" })
  leftValue!: string;

  @IsNotEmpty({ message: "Operator is required" })
  @IsEnum(FormulaOperator, { message: "Operator is invalid" })
  operator!: FormulaOperator;

  @IsNotEmpty({ message: "Right operand type is required" })
  @IsEnum(FormulaOperandType, { message: "Right operand type is invalid" })
  rightType!: FormulaOperandType;

  @IsNotEmpty({ message: "Right operand value is required" })
  @IsString({ message: "Right operand value must be a string" })
  rightValue!: string;

  @IsNotEmpty({ message: "Result key is required" })
  @IsString({ message: "Result key must be a string" })
  resultKey!: string;
}

export class IkuFormulaDetailUpdateDto {
  @IsNotEmpty({ message: "Sequence is required" })
  @IsInt({ message: "Sequence must be an integer" })
  @Min(1, { message: "Sequence must be at least 1" })
  sequence!: number;

  @IsNotEmpty({ message: "Left operand type is required" })
  @IsEnum(FormulaOperandType, { message: "Left operand type is invalid" })
  leftType!: FormulaOperandType;

  @IsNotEmpty({ message: "Left operand value is required" })
  @IsString({ message: "Left operand value must be a string" })
  leftValue!: string;

  @IsNotEmpty({ message: "Operator is required" })
  @IsEnum(FormulaOperator, { message: "Operator is invalid" })
  operator!: FormulaOperator;

  @IsNotEmpty({ message: "Right operand type is required" })
  @IsEnum(FormulaOperandType, { message: "Right operand type is invalid" })
  rightType!: FormulaOperandType;

  @IsNotEmpty({ message: "Right operand value is required" })
  @IsString({ message: "Right operand value must be a string" })
  rightValue!: string;

  @IsNotEmpty({ message: "Result key is required" })
  @IsString({ message: "Result key must be a string" })
  resultKey!: string;
}
