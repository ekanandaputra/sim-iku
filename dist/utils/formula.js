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
async function evaluateFormula(formulaId, componentValues, visited = new Set()) {
    if (visited.has(formulaId)) {
        throw new Error(`Circular formula dependency detected for '${formulaId}'`);
    }
    visited.add(formulaId);
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
    const resolveOperand = async (type, value) => {
        if (type === enums_1.FormulaOperandType.component) {
            // Support chaining formulas via special component key: "formula:<idOrName>"
            if (value.startsWith("formula:")) {
                const ref = value.slice("formula:".length).trim();
                if (!ref) {
                    throw new Error("Formula reference must include an id or name after 'formula:'");
                }
                // Attempt to resolve by UUID first, otherwise fall back to name within the same IKU
                let refFormula = await prisma_1.prisma.iKUFormula.findUnique({ where: { id: ref } });
                if (!refFormula) {
                    refFormula = await prisma_1.prisma.iKUFormula.findFirst({
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
        const left = await resolveOperand(step.leftType, step.leftValue);
        const right = await resolveOperand(step.rightType, step.rightValue);
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
