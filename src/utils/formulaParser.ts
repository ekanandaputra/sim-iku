/**
 * Formula Expression Parser
 *
 * Converts a human-readable math expression like:
 *   ((COMP001 + COMP002) / (COMP003 + COMP004)) * 100
 *
 * Into sequential formula steps compatible with the IKUFormulaDetail model:
 *   Seq 1: T1 = COMP001 [component] + COMP002 [component]
 *   Seq 2: T2 = COMP003 [component] + COMP004 [component]
 *   Seq 3: T3 = T1 [temp] / T2 [temp]
 *   Seq 4: RESULT = T3 [temp] * 100 [constant]
 *
 * Grammar (recursive descent, standard math precedence):
 *   Expression  → Term (('+' | '-') Term)*
 *   Term        → Factor (('*' | '/') Factor)*
 *   Factor      → NUMBER | IDENTIFIER | '(' Expression ')'
 */

// ─── Token types ──────────────────────────────────────────────────────────────

type TokenType =
  | "NUMBER"
  | "IDENTIFIER"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "LPAREN"
  | "RPAREN"
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
}

// ─── AST node types ───────────────────────────────────────────────────────────

interface NumberNode {
  kind: "number";
  value: string;
}

interface IdentifierNode {
  kind: "identifier";
  value: string; // component code
}

interface BinaryOpNode {
  kind: "binary";
  operator: "+" | "-" | "*" | "/";
  left: ASTNode;
  right: ASTNode;
}

type ASTNode = NumberNode | IdentifierNode | BinaryOpNode;

// ─── Output step (matches IKUFormulaDetail shape) ─────────────────────────────

export type OperandType = "component" | "constant" | "temp";
export type Operator = "ADD" | "SUB" | "MUL" | "DIV";

export interface FormulaStep {
  sequence: number;
  leftType: OperandType;
  leftValue: string;
  operator: Operator;
  rightType: OperandType;
  rightValue: string;
  resultKey: string;
}

export interface ParsedFormula {
  steps: FormulaStep[];
  finalResultKey: string;
  componentCodes: string[]; // all unique component codes found
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "LPAREN", value: "(" });
      i++;
    } else if (ch === ")") {
      tokens.push({ type: "RPAREN", value: ")" });
      i++;
    } else if (ch === "+") {
      tokens.push({ type: "PLUS", value: "+" });
      i++;
    } else if (ch === "-") {
      // Negative numbers: treat '-' as part of number if:
      //   - at start of input
      //   - after '(' or another operator
      const prev = tokens[tokens.length - 1];
      const isUnaryMinus =
        !prev ||
        prev.type === "LPAREN" ||
        prev.type === "PLUS" ||
        prev.type === "MINUS" ||
        prev.type === "STAR" ||
        prev.type === "SLASH";

      if (isUnaryMinus && i + 1 < input.length && (/\d/.test(input[i + 1]) || input[i + 1] === ".")) {
        // Parse as negative number
        let num = "-";
        i++;
        while (i < input.length && (/\d/.test(input[i]) || input[i] === ".")) {
          num += input[i];
          i++;
        }
        tokens.push({ type: "NUMBER", value: num });
      } else {
        tokens.push({ type: "MINUS", value: "-" });
        i++;
      }
    } else if (ch === "*") {
      tokens.push({ type: "STAR", value: "*" });
      i++;
    } else if (ch === "/") {
      tokens.push({ type: "SLASH", value: "/" });
      i++;
    } else if (/\d/.test(ch) || ch === ".") {
      // Number literal (integer or decimal)
      let num = "";
      while (i < input.length && (/\d/.test(input[i]) || input[i] === ".")) {
        num += input[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: num });
    } else if (/[A-Za-z_]/.test(ch)) {
      // Identifier (component code): letters, digits, underscores
      let id = "";
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) {
        id += input[i];
        i++;
      }
      tokens.push({ type: "IDENTIFIER", value: id });
    } else {
      throw new Error(`Unexpected character '${ch}' at position ${i}`);
    }
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} ('${token.value}')`);
    }
    return this.advance();
  }

  /**
   * Expression → Term (('+' | '-') Term)*
   */
  parseExpression(): ASTNode {
    let left = this.parseTerm();

    while (this.peek().type === "PLUS" || this.peek().type === "MINUS") {
      const op = this.advance();
      const right = this.parseTerm();
      left = {
        kind: "binary",
        operator: op.value as "+" | "-",
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Term → Factor (('*' | '/') Factor)*
   */
  private parseTerm(): ASTNode {
    let left = this.parseFactor();

    while (this.peek().type === "STAR" || this.peek().type === "SLASH") {
      const op = this.advance();
      const right = this.parseFactor();
      left = {
        kind: "binary",
        operator: op.value as "*" | "/",
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Factor → NUMBER | IDENTIFIER | '(' Expression ')'
   */
  private parseFactor(): ASTNode {
    const token = this.peek();

    if (token.type === "NUMBER") {
      this.advance();
      return { kind: "number", value: token.value };
    }

    if (token.type === "IDENTIFIER") {
      this.advance();
      return { kind: "identifier", value: token.value };
    }

    if (token.type === "LPAREN") {
      this.advance();
      const expr = this.parseExpression();
      this.expect("RPAREN");
      return expr;
    }

    throw new Error(`Unexpected token ${token.type} ('${token.value}')`);
  }

  parse(): ASTNode {
    const ast = this.parseExpression();
    if (this.peek().type !== "EOF") {
      throw new Error(`Unexpected token after end of expression: '${this.peek().value}'`);
    }
    return ast;
  }
}

// ─── Code generator (AST → steps) ─────────────────────────────────────────────

function operatorToEnum(op: string): Operator {
  switch (op) {
    case "+": return "ADD";
    case "-": return "SUB";
    case "*": return "MUL";
    case "/": return "DIV";
    default: throw new Error(`Unknown operator '${op}'`);
  }
}

function flattenAST(
  ast: ASTNode,
  steps: FormulaStep[],
  componentCodes: Set<string>,
  counter: { value: number },
  finalResultKey: string
): { type: OperandType; value: string } {
  if (ast.kind === "number") {
    return { type: "constant", value: ast.value };
  }

  if (ast.kind === "identifier") {
    componentCodes.add(ast.value);
    return { type: "component", value: ast.value };
  }

  // Binary operation — recursively flatten left and right, then emit a step
  const left = flattenAST(ast.left, steps, componentCodes, counter, finalResultKey);
  const right = flattenAST(ast.right, steps, componentCodes, counter, finalResultKey);

  const seq = counter.value++;
  const resultKey = `T${seq}`;

  steps.push({
    sequence: seq,
    leftType: left.type,
    leftValue: left.value,
    operator: operatorToEnum(ast.operator),
    rightType: right.type,
    rightValue: right.value,
    resultKey,
  });

  return { type: "temp", value: resultKey };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a math expression string and convert it to formula steps.
 *
 * @param expression  e.g. "((COMP001 + COMP002) / (COMP003 + COMP004)) * 100"
 * @param finalResultKey  the key for the final result, default "RESULT"
 * @returns ParsedFormula with steps and component codes
 *
 * @example
 * parseFormulaExpression("(A + B) * 100")
 * // Returns:
 * // {
 * //   steps: [
 * //     { sequence: 1, leftType: "component", leftValue: "A", operator: "ADD", rightType: "component", rightValue: "B", resultKey: "T1" },
 * //     { sequence: 2, leftType: "temp", leftValue: "T1", operator: "MUL", rightType: "constant", rightValue: "100", resultKey: "RESULT" },
 * //   ],
 * //   finalResultKey: "RESULT",
 * //   componentCodes: ["A", "B"],
 * // }
 */
export function parseFormulaExpression(
  expression: string,
  finalResultKey: string = "RESULT"
): ParsedFormula {
  if (!expression || !expression.trim()) {
    throw new Error("Formula expression cannot be empty");
  }

  const tokens = tokenize(expression.trim());
  const parser = new Parser(tokens);
  const ast = parser.parse();

  const steps: FormulaStep[] = [];
  const componentCodes = new Set<string>();
  const counter = { value: 1 };

  flattenAST(ast, steps, componentCodes, counter, finalResultKey);

  // Rename the last step's resultKey to the finalResultKey
  if (steps.length > 0) {
    steps[steps.length - 1].resultKey = finalResultKey;
  }

  return {
    steps,
    finalResultKey,
    componentCodes: Array.from(componentCodes),
  };
}
