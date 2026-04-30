import { prisma } from "../lib/prisma";
import { FormulaOperandType, FormulaOperator } from "../generated/prisma/enums";

export type ComponentValues = Record<string, number>;

export type FormulaEvaluationStep = {
  sequence: number;
  expression: string;
  result: number;
};

export type FormulaEvaluationResult = {
  result: number;
  steps: FormulaEvaluationStep[];
};

/**
 * Evaluate a formula by running all steps in sequence and returning the final result.
 *
 * Steps are executed using the provided component values and intermediate results are
 * stored using the `resultKey` defined on each step.
 */
export async function evaluateFormula(
  formulaId: string,
  componentValues: ComponentValues,
  visited: Set<string> = new Set()
): Promise<FormulaEvaluationResult> {
  if (visited.has(formulaId)) {
    throw new Error(`Circular formula dependency detected for '${formulaId}'`);
  }
  visited.add(formulaId);

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
  const steps: FormulaEvaluationStep[] = [];

  const resolveOperand = async (type: FormulaOperandType, value: string): Promise<number> => {
    if (type === FormulaOperandType.component) {
      // Support chaining formulas via special component key: "formula:<idOrName>"
      if (value.startsWith("formula:")) {
        const ref = value.slice("formula:".length).trim();
        if (!ref) {
          throw new Error("Formula reference must include an id or name after 'formula:'");
        }

        // Attempt to resolve by UUID first, otherwise fall back to name within the same IKU
        let refFormula = await prisma.iKUFormula.findUnique({ where: { id: ref } });
        if (!refFormula) {
          refFormula = await prisma.iKUFormula.findFirst({
            where: { name: ref, ikuId: formula.ikuId },
          });
        }

        if (!refFormula) {
          throw new Error(`Formula reference '${ref}' not found`);
        }

        const evaluation = await evaluateFormula(refFormula.id, componentValues, visited);
        return evaluation.result;
      }

      if (!(value in componentValues)) {
        throw new Error(`Component value not provided for key '${value}'`);
      }
      return componentValues[value];
    }

    if (type === FormulaOperandType.formula_ref) {
      const ref = value.trim();
      if (!ref) {
        throw new Error("Formula reference must include an id or name");
      }

      let refFormula = await prisma.iKUFormula.findUnique({ where: { id: ref } });
      if (!refFormula) {
        refFormula = await prisma.iKUFormula.findFirst({
          where: { 
            ikuId: formula.ikuId,
            OR: [
              { name: ref },
              { finalResultKey: ref }
            ]
          },
          orderBy: { version: "desc" }
        });
      }

      if (!refFormula) {
        throw new Error(`Formula reference '${ref}' not found`);
      }

      const evaluation = await evaluateFormula(refFormula.id, componentValues, visited);
      return evaluation.result;
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

  const operatorSymbol = (operator: FormulaOperator): string => {
    switch (operator) {
      case FormulaOperator.ADD:
        return "+";
      case FormulaOperator.SUB:
        return "-";
      case FormulaOperator.MUL:
        return "*";
      case FormulaOperator.DIV:
        return "/";
      default:
        return operator as string;
    }
  };

  for (const step of formula.details) {
    const left = await resolveOperand(step.leftType, step.leftValue);
    const right = await resolveOperand(step.rightType, step.rightValue);

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

    steps.push({
      sequence: step.sequence,
      expression: `${step.leftValue} ${operatorSymbol(step.operator)} ${step.rightValue}`,
      result,
    });
  }

  const finalKey = formula.finalResultKey ?? "RESULT";
  if (!(finalKey in tempResults)) {
    throw new Error(`Final result key '${finalKey}' not found after evaluation`);
  }

  return {
    result: tempResults[finalKey],
    steps,
  };
}

export async function getFormulaRequiredComponentCodes(
  formulaId: string,
  visited: Set<string> = new Set()
): Promise<Set<string>> {
  if (visited.has(formulaId)) return new Set();
  visited.add(formulaId);

  const formula = await prisma.iKUFormula.findUnique({
    where: { id: formulaId },
    include: { details: true },
  });

  if (!formula || !formula.isActive) return new Set();

  const codes = new Set<string>();

  for (const step of formula.details) {
    if (step.leftType === FormulaOperandType.component) {
      if (step.leftValue.startsWith("formula:")) {
        const ref = step.leftValue.slice("formula:".length).trim();
        let refFormula = await prisma.iKUFormula.findUnique({ where: { id: ref } });
        if (!refFormula) refFormula = await prisma.iKUFormula.findFirst({ where: { name: ref, ikuId: formula.ikuId } });
        if (refFormula) {
          const subCodes = await getFormulaRequiredComponentCodes(refFormula.id, visited);
          subCodes.forEach(c => codes.add(c));
        }
      } else {
        codes.add(step.leftValue);
      }
    } else if (step.leftType === FormulaOperandType.formula_ref) {
      let refFormula = await prisma.iKUFormula.findUnique({ where: { id: step.leftValue } });
      if (!refFormula) {
        refFormula = await prisma.iKUFormula.findFirst({ 
          where: { 
            ikuId: formula.ikuId,
            OR: [
              { name: step.leftValue },
              { finalResultKey: step.leftValue }
            ]
          },
          orderBy: { version: "desc" }
        });
      }
      if (refFormula) {
        const subCodes = await getFormulaRequiredComponentCodes(refFormula.id, visited);
        subCodes.forEach(c => codes.add(c));
      }
    }

    if (step.rightType === FormulaOperandType.component) {
      if (step.rightValue.startsWith("formula:")) {
        const ref = step.rightValue.slice("formula:".length).trim();
        let refFormula = await prisma.iKUFormula.findUnique({ where: { id: ref } });
        if (!refFormula) refFormula = await prisma.iKUFormula.findFirst({ where: { name: ref, ikuId: formula.ikuId } });
        if (refFormula) {
          const subCodes = await getFormulaRequiredComponentCodes(refFormula.id, visited);
          subCodes.forEach(c => codes.add(c));
        }
      } else {
        codes.add(step.rightValue);
      }
    } else if (step.rightType === FormulaOperandType.formula_ref) {
      let refFormula = await prisma.iKUFormula.findUnique({ where: { id: step.rightValue } });
      if (!refFormula) {
        refFormula = await prisma.iKUFormula.findFirst({ 
          where: { 
            ikuId: formula.ikuId,
            OR: [
              { name: step.rightValue },
              { finalResultKey: step.rightValue }
            ]
          },
          orderBy: { version: "desc" }
        });
      }
      if (refFormula) {
        const subCodes = await getFormulaRequiredComponentCodes(refFormula.id, visited);
        subCodes.forEach(c => codes.add(c));
      }
    }
  }

  return codes;
}
