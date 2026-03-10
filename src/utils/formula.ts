import { prisma } from "../lib/prisma";
import { FormulaOperandType, FormulaOperator } from "../generated/prisma/enums";

export type ComponentValues = Record<string, number>;

export async function evaluateFormula(
  formulaId: string,
  componentValues: ComponentValues
): Promise<number> {
  const formula = await prisma.iKUFormula.findUnique({
    where: { id: formulaId },
    include: {
      details: {
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!formula) {
    throw new Error("Formula not found");
  }

  const tempResults: Record<string, number> = {};

  const resolveOperand = (type: FormulaOperandType, value: string): number => {
    if (type === FormulaOperandType.component) {
      if (!(value in componentValues)) {
        throw new Error(`Component value not provided for key '${value}'`);
      }
      return componentValues[value];
    }

    if (type === FormulaOperandType.constant) {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        throw new Error(`Invalid constant value '${value}'`);
      }
      return parsed;
    }

    if (type === FormulaOperandType.temp) {
      if (!(value in tempResults)) {
        throw new Error(`Temporary value not found for key '${value}'`);
      }
      return tempResults[value];
    }

    throw new Error(`Unsupported operand type '${type}'`);
  };

  for (const step of formula.details) {
    const left = resolveOperand(step.leftType, step.leftValue);
    const right = resolveOperand(step.rightType, step.rightValue);

    let result: number;

    switch (step.operator) {
      case FormulaOperator.ADD:
        result = left + right;
        break;
      case FormulaOperator.SUB:
        result = left - right;
        break;
      case FormulaOperator.MUL:
        result = left * right;
        break;
      case FormulaOperator.DIV:
        if (right === 0) {
          throw new Error("Division by zero");
        }
        result = left / right;
        break;
      default:
        throw new Error(`Unsupported operator '${step.operator}'`);
    }

    tempResults[step.resultKey] = result;
  }

  const finalKey = formula.finalResultKey ?? "RESULT";
  if (!(finalKey in tempResults)) {
    throw new Error(`Final result key '${finalKey}' not found after evaluation`);
  }

  return tempResults[finalKey];
}
