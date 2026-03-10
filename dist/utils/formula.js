"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateFormula = evaluateFormula;
const prisma_1 = require("../lib/prisma");
const enums_1 = require("../generated/prisma/enums");
/**
 * Evaluate a formula by running all steps in sequence and returning the final result.
 *
 * Steps are executed using the provided component values and intermediate results are
 * stored using the `resultKey` defined on each step.
 */
async function evaluateFormula(formulaId, componentValues) {
    const formula = await prisma_1.prisma.iKUFormula.findUnique({
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
    const tempResults = {};
    const steps = [];
    const resolveOperand = (type, value) => {
        if (type === enums_1.FormulaOperandType.component) {
            if (!(value in componentValues)) {
                throw new Error(`Component value not provided for key '${value}'`);
            }
            return componentValues[value];
        }
        if (type === enums_1.FormulaOperandType.constant) {
            const parsed = Number(value);
            if (Number.isNaN(parsed)) {
                throw new Error(`Invalid constant value '${value}'`);
            }
            return parsed;
        }
        if (type === enums_1.FormulaOperandType.temp) {
            if (!(value in tempResults)) {
                throw new Error(`Temporary value not found for key '${value}'`);
            }
            return tempResults[value];
        }
        throw new Error(`Unsupported operand type '${type}'`);
    };
    const operatorSymbol = (operator) => {
        switch (operator) {
            case enums_1.FormulaOperator.ADD:
                return "+";
            case enums_1.FormulaOperator.SUB:
                return "-";
            case enums_1.FormulaOperator.MUL:
                return "*";
            case enums_1.FormulaOperator.DIV:
                return "/";
            default:
                return operator;
        }
    };
    for (const step of formula.details) {
        const left = resolveOperand(step.leftType, step.leftValue);
        const right = resolveOperand(step.rightType, step.rightValue);
        let result;
        switch (step.operator) {
            case enums_1.FormulaOperator.ADD:
                result = left + right;
                break;
            case enums_1.FormulaOperator.SUB:
                result = left - right;
                break;
            case enums_1.FormulaOperator.MUL:
                result = left * right;
                break;
            case enums_1.FormulaOperator.DIV:
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
