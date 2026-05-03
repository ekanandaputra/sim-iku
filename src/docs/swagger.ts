import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "SIM IKU API",
    version: "1.0.0",
    description: "CRUD API for managing IKU data",
  },
  servers: [
    {
      url: "/",
      description: "Local server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "IKU", description: "IKU management endpoints" },
    { name: "Component", description: "Component management endpoints" },
    { name: "Formula", description: "IKU formula calculation and management" },
    { name: "ComponentRealization", description: "Component realization endpoints" },
    { name: "IKUResult", description: "IKU result endpoints" },
    { name: "IKUTarget", description: "IKU target endpoints" },
    { name: "ComponentTarget", description: "Component target endpoints" },
    { name: "Dashboard", description: "Dashboard visualization endpoints" },
    { name: "Document", description: "Document upload and tagging endpoints" },
    { name: "Tag", description: "Tag management and assignment endpoints" },
    { name: "Import", description: "Import master data (IKU, IKP, Mapping) from Excel" },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Iku: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          isDirectInput: { type: "boolean", default: false },
          unit: { type: "string", enum: ["percentage", "text", "number", "file"], default: "percentage" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "code", "name"],
      },
      IkuCreate: {
        type: "object",
        properties: {
          code: { type: "string", maxLength: 50 },
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
          isDirectInput: { type: "boolean", default: false },
          unit: { type: "string", enum: ["percentage", "text", "number", "file"], default: "percentage" },
        },
        required: ["code", "name"],
      },
      IkuUpdate: {
        type: "object",
        properties: {
          code: { type: "string", maxLength: 50 },
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
          isDirectInput: { type: "boolean" },
          unit: { type: "string", enum: ["percentage", "text", "number", "file"] },
        },
        required: ["code", "name"],
      },
      Component: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          dataType: { type: "string", enum: ["number", "percentage", "integer"] },
          sourceType: { type: "string", enum: ["database", "api", "manual"] },
          periodType: { type: "string", enum: ["monthly", "quarter", "semester", "yearly"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "code", "name"],
      },
      ComponentCreate: {
        type: "object",
        properties: {
          code: { type: "string", maxLength: 50 },
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
          dataType: { type: "string", enum: ["number", "percentage", "integer"] },
          sourceType: { type: "string", enum: ["database", "api", "manual"] },
          periodType: { type: "string", enum: ["monthly", "quarter", "semester", "yearly"] },
          tags: { type: "array", items: { $ref: "#/components/schemas/Tag" } },
          ikus: { type: "array", items: { $ref: "#/components/schemas/IkuRef" } },
        },
        required: ["code", "name"],
      },
      ComponentUpdate: {
        type: "object",
        properties: {
          code: { type: "string", maxLength: 50 },
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
          dataType: { type: "string", enum: ["number", "percentage", "integer"] },
          sourceType: { type: "string", enum: ["database", "api", "manual"] },
          periodType: { type: "string", enum: ["monthly", "quarter", "semester", "yearly"] },
        },
        required: ["code", "name"],
      },
      Tag: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Prioritas Nasional" },
          color: { type: "string", nullable: true, example: "#3B82F6" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "name"],
      },
      TagCreate: {
        type: "object",
        properties: {
          name: { type: "string", example: "Prioritas Nasional" },
          color: { type: "string", nullable: true, example: "#3B82F6", description: "Hex color code (#RRGGBB)" },
        },
        required: ["name"],
      },
      TagUpdate: {
        type: "object",
        properties: {
          name: { type: "string", example: "Prioritas Nasional" },
          color: { type: "string", nullable: true, example: "#3B82F6", description: "Hex color code (#RRGGBB)" },
        },
      },
      IkuRef: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string" },
          name: { type: "string" },
        },
        required: ["id", "code", "name"],
      },
      ComponentWithMeta: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          dataType: { type: "string", enum: ["number", "percentage", "integer"], nullable: true },
          sourceType: { type: "string", enum: ["database", "api", "manual"], nullable: true },
          periodType: { type: "string", enum: ["monthly", "quarter", "semester", "yearly"] },
          tags: { type: "array", items: { $ref: "#/components/schemas/Tag" } },
          ikus: { type: "array", items: { $ref: "#/components/schemas/IkuRef" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "code", "name"],
      },
      RealizationRow: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", nullable: true, description: "null jika belum ada realisasi bulan ini" },
          month: { type: "integer", minimum: 1, maximum: 12 },
          monthName: { type: "string", example: "Januari" },
          year: { type: "integer" },
          value: { type: "number", nullable: true },
        },
      },
      QuarterSummary: {
        type: "object",
        properties: {
          quarter: { type: "string", example: "Q1" },
          months: { type: "array", items: { type: "integer" }, example: [1, 2, 3] },
          target: { type: "number", nullable: true },
        },
      },
      ComponentRealizationView: {
        type: "object",
        properties: {
          component: { $ref: "#/components/schemas/ComponentWithMeta" },
          year: { type: "integer", example: 2024 },
          target: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", nullable: true },
              targetQ1: { type: "number", nullable: true },
              targetQ2: { type: "number", nullable: true },
              targetQ3: { type: "number", nullable: true },
              targetQ4: { type: "number", nullable: true },
              targetYear: { type: "number", nullable: true },
              _action: { type: "string", enum: ["POST", "PUT"], description: "Hint: POST jika target belum ada, PUT jika sudah ada" },
            },
          },
          quarters: { type: "array", items: { $ref: "#/components/schemas/QuarterSummary" } },
          realizations: { type: "array", items: { $ref: "#/components/schemas/RealizationRow" } },
        },
      },
      SuccessResponseSingleComponent: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Component created successfully" },
          data: { $ref: "#/components/schemas/Component" },
        },
      },
      SuccessResponseListComponent: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Component" },
          },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "object",
            additionalProperties: { type: "string" },
            example: { code: "Code is required", name: "Name is required" },
          },
        },
      },
      BusinessErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "IKU code already exists" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "email"],
      },
      AuthToken: {
        type: "object",
        properties: {
          token: { type: "string" },
        },
        required: ["token"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          name: { type: "string" },
        },
        required: ["email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
        required: ["email", "password"],
      },
      SuccessResponseSingleUser: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "User registered successfully" },
          data: { $ref: "#/components/schemas/User" },
        },
      },
      SuccessResponseAuth: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Logged in successfully" },
          data: { $ref: "#/components/schemas/AuthToken" },
        },
      },

      SuccessResponseSingle: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "IKU created successfully" },
          data: { $ref: "#/components/schemas/Iku" },
        },
      },
      SuccessResponseList: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Iku" },
          },
        },
      },
      IKUComponent: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ikuId: { type: "string", format: "uuid" },
          componentId: { type: "string", format: "uuid" },
        },
        required: ["id", "ikuId", "componentId"],
      },
      IkuComponentMapping: {
        type: "object",
        properties: {
          componentId: { type: "string", format: "uuid" },
        },
        required: ["componentId"],
      },
      SuccessResponseSingleIKUComponent: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Component mapped to IKU successfully" },
          data: { $ref: "#/components/schemas/IKUComponent" },
        },
      },
      IkuFormula: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ikuId: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          finalResultKey: { type: "string" },
          isActive: { type: "boolean" },
          isFinal: { type: "boolean" },
          version: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "ikuId", "name", "finalResultKey", "isActive", "version"],
      },
      SuccessResponseSingleFormula: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Formula created successfully" },
          data: { $ref: "#/components/schemas/IkuFormula" },
        },
      },
      SuccessResponseListFormula: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/IkuFormula" },
          },
        },
      },
      IkuFormulaCreate: {
        type: "object",
        properties: {
          ikuId: { type: "string", format: "uuid" },
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
          finalResultKey: { type: "string", maxLength: 100 },
          isActive: { type: "boolean" },
          isFinal: { type: "boolean" },
          steps: {
            type: "array",
            items: { $ref: "#/components/schemas/IkuFormulaDetailCreate" },
          },
        },
        required: ["ikuId", "name", "steps"],
      },
      IkuFormulaUpdate: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
          finalResultKey: { type: "string", maxLength: 100 },
          isActive: { type: "boolean" },
          isFinal: { type: "boolean" },
          steps: {
            type: "array",
            items: { $ref: "#/components/schemas/IkuFormulaDetailCreate" },
          },
        },
        required: ["name"],
      },
      IkuFormulaDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          formulaId: { type: "string", format: "uuid" },
          sequence: { type: "integer" },
          leftType: { type: "string", enum: ["component", "constant", "temp", "formula_ref"] },
          leftValue: { type: "string" },
          operator: { type: "string", enum: ["ADD", "SUB", "MUL", "DIV"] },
          rightType: { type: "string", enum: ["component", "constant", "temp", "formula_ref"] },
          rightValue: { type: "string" },
          resultKey: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "formulaId", "sequence", "leftType", "leftValue", "operator", "rightType", "rightValue", "resultKey"],
      },
      IkuFormulaDetailCreate: {
        type: "object",
        properties: {
          sequence: { type: "integer" },
          leftType: { type: "string", enum: ["component", "constant", "temp", "formula_ref"] },
          leftValue: { type: "string" },
          operator: { type: "string", enum: ["ADD", "SUB", "MUL", "DIV"] },
          rightType: { type: "string", enum: ["component", "constant", "temp", "formula_ref"] },
          rightValue: { type: "string" },
          resultKey: { type: "string" },
        },
        required: ["sequence", "leftType", "leftValue", "operator", "rightType", "rightValue", "resultKey"],
      },
      IkuFormulaDetailUpdate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          sequence: { type: "integer" },
          leftType: { type: "string", enum: ["component", "constant", "temp", "formula_ref"] },
          leftValue: { type: "string" },
          operator: { type: "string", enum: ["ADD", "SUB", "MUL", "DIV"] },
          rightType: { type: "string", enum: ["component", "constant", "temp", "formula_ref"] },
          rightValue: { type: "string" },
          resultKey: { type: "string" },
        },
        required: ["id", "sequence", "leftType", "leftValue", "operator", "rightType", "rightValue", "resultKey"],
      },
      FormulaComponentList: {
        type: "object",
        properties: {
          formulaId: { type: "string", format: "uuid" },
          components: {
            type: "array",
            items: { $ref: "#/components/schemas/Component" },
          },
        },
        required: ["formulaId", "components"],
      },
      FormulaTestRequest: {
        type: "object",
        properties: {
          componentValues: {
            type: "object",
            additionalProperties: { type: "number" },
          },
        },
        required: ["componentValues"],
      },
      FormulaEvaluationStep: {
        type: "object",
        properties: {
          sequence: { type: "integer" },
          expression: { type: "string" },
          result: { type: "number" },
        },
        required: ["sequence", "expression", "result"],
      },
      FormulaTestResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              result: { type: "number" },
              steps: {
                type: "array",
                items: { $ref: "#/components/schemas/FormulaEvaluationStep" },
              },
            },
            required: ["result", "steps"],
          },
        },
      },
      ComponentRealizationDocument: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          realizationId: { type: "string", format: "uuid" },
          documentId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          document: { $ref: "#/components/schemas/Document" },
        },
      },
      ComponentRealization: {
        type: "object",
        properties: {
          idRealization: { type: "string", format: "uuid" },
          idComponent: { type: "string", format: "uuid" },
          month: { type: "integer", nullable: true },
          year: { type: "integer" },
          value: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          component: { type: "object" },
          documents: {
            type: "array",
            items: { $ref: "#/components/schemas/ComponentRealizationDocument" }
          },
        },
        required: ["idRealization", "idComponent", "year", "value"],
      },
      ComponentRealizationCreate: {
        type: "object",
        properties: {
          idComponent: { type: "string" },
          month: { type: "integer" },
          year: { type: "integer" },
          value: { type: "number" },
          documentIds: { type: "array", items: { type: "string", format: "uuid" } },
        },
        required: ["idComponent", "year", "value"],
      },
      ComponentRealizationUpdate: {
        type: "object",
        properties: {
          value: { type: "number" },
          documentIds: { type: "array", items: { type: "string", format: "uuid" } },
        },
        required: ["value"],
      },
      Document: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          originalName: { type: "string" },
          filename: { type: "string" },
          url: { type: "string" },
          mimeType: { type: "string", nullable: true },
          size: { type: "integer", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "originalName", "filename", "url"],
      },
      IkuResult: {
        type: "object",
        properties: {
          idResult: { type: "integer" },
          idIku: { type: "string" },
          month: { type: "integer" },
          year: { type: "integer" },
          calculatedValue: { type: "number", nullable: true, description: "Numeric value for unit: percentage | number" },
          textValue: { type: "string", nullable: true, description: "Text value for unit: text" },
          documentIds: { type: "array", items: { type: "string", format: "uuid" }, nullable: true, description: "Document IDs for unit: file" },
          metadata: {
            type: "object",
            nullable: true,
            description: "JSON metadata for additional data",
          },
          formulaVersion: { type: ["string", "null"] },
          calculatedAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          iku: { type: "object" },
        },
        required: ["idResult", "idIku", "month", "year", "calculatedAt"],
      },
      IkuResultCreate: {
        type: "object",
        description: "Create or upsert an IKU result. Provide calculatedValue for unit=percentage|number, metadata.text for unit=text, metadata.files for unit=file.",
        properties: {
          idIku: { type: "string" },
          month: { type: "integer" },
          year: { type: "integer" },
          calculatedValue: { type: "number", nullable: true, description: "Required for unit: percentage | number" },
          textValue: { type: "string", nullable: true, description: "Required for unit: text" },
          documentIds: { type: "array", items: { type: "string", format: "uuid" }, nullable: true, description: "Required for unit: file" },
          metadata: {
            type: "object",
            nullable: true,
            description: "Optional JSON metadata",
          },
          formulaVersion: { type: "string" },
          calculatedAt: { type: "string", format: "date-time" },
        },
        required: ["idIku", "month", "year"],
      },
      IkuResultUpdate: {
        type: "object",
        properties: {
          calculatedValue: { type: "number", nullable: true, description: "For unit: percentage | number" },
          textValue: { type: "string", nullable: true, description: "For unit: text" },
          documentIds: { type: "array", items: { type: "string", format: "uuid" }, nullable: true, description: "For unit: file" },
          metadata: {
            type: "object",
            nullable: true,
            description: "Optional JSON metadata",
          },
          formulaVersion: { type: "string" },
          calculatedAt: { type: "string", format: "date-time" },
        },
      },
      IkuTarget: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ikuId: { type: "string", format: "uuid" },
          year: { type: "integer" },
          targetQ1: { type: "number", nullable: true },
          targetQ2: { type: "number", nullable: true },
          targetQ3: { type: "number", nullable: true },
          targetQ4: { type: "number", nullable: true },
          targetYear: { type: "number", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "ikuId", "year"],
      },
      IkuTargetCreate: {
        type: "object",
        properties: {
          ikuId: { type: "string", format: "uuid" },
          year: { type: "integer" },
          targetQ1: { type: "number" },
          targetQ2: { type: "number" },
          targetQ3: { type: "number" },
          targetQ4: { type: "number" },
          targetYear: { type: "number" },
        },
        required: ["ikuId", "year"],
      },
      IkuTargetUpdate: {
        type: "object",
        properties: {
          year: { type: "integer" },
          targetQ1: { type: "number" },
          targetQ2: { type: "number" },
          targetQ3: { type: "number" },
          targetQ4: { type: "number" },
          targetYear: { type: "number" },
        },
      },
      ComponentTarget: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          componentId: { type: "string", format: "uuid" },
          year: { type: "integer" },
          targetQ1: { type: "number", nullable: true },
          targetQ2: { type: "number", nullable: true },
          targetQ3: { type: "number", nullable: true },
          targetQ4: { type: "number", nullable: true },
          targetYear: { type: "number", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "componentId", "year"],
      },
      ComponentTargetCreate: {
        type: "object",
        properties: {
          componentId: { type: "string", format: "uuid" },
          year: { type: "integer" },
          targetQ1: { type: "number" },
          targetQ2: { type: "number" },
          targetQ3: { type: "number" },
          targetQ4: { type: "number" },
          targetYear: { type: "number" },
        },
        required: ["componentId", "year"],
      },
      ComponentTargetUpdate: {
        type: "object",
        properties: {
          year: { type: "integer" },
          targetQ1: { type: "number" },
          targetQ2: { type: "number" },
          targetQ3: { type: "number" },
          targetQ4: { type: "number" },
          targetYear: { type: "number" },
        },
      },
      RealizationMetric: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["IKU", "COMPONENT"] },
          code: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          unit: { type: "string", enum: ["percentage", "text", "number", "file"] },
          isDirectInput: { type: "boolean" },
          dataType: { type: "string", enum: ["number", "percentage", "integer"] },
          sourceType: { type: "string", enum: ["database", "api", "manual"] },
          periodType: { type: "string", enum: ["monthly", "quarter", "semester", "yearly"] },
          tags: { type: "array", items: { $ref: "#/components/schemas/Tag" } },
          ikus: { type: "array", items: { $ref: "#/components/schemas/IkuRef" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        }
      },
      SuccessResponseListRealizationMetrics: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/RealizationMetric" },
          },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            }
          }
        }
      },
    },
  },
  paths: {
    "/api/realizations/metrics": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["ComponentRealization"],
        summary: "List metrics (IKU & Component) available for realization",
        description: "Returns a paginated, unified list of IKUs (where isDirectInput=true) and Components. Filter by name and tag (tag only applies to Components).",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number (1-based)",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Number of items per page",
          },
          {
            name: "name",
            in: "query",
            schema: { type: "string" },
            description: "Filter metrics by name (substring match)",
          },
          {
            name: "tag",
            in: "query",
            schema: { type: "string" },
            description: "Filter Components by tag name (substring match). IKUs will not be returned if tag is provided.",
          },
        ],
        responses: {
          "200": {
            description: "Unified list of Realization Metrics",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseListRealizationMetrics" },
              },
            },
          },
        },
      },
    },
    "/api/realizations/{type}/{id}/view": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["ComponentRealization"],
        summary: "Get Realization View for Component or IKU",
        description: "Returns 6 years of target and realization data (selected year + 5 previous) for a specific metric type (component or iku).",
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["component", "iku"] },
            description: "Metric type (component or iku)",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Metric ID",
          },
          {
            name: "year",
            in: "query",
            schema: { type: "integer" },
            description: "Base year (defaults to current year)",
          },
        ],
        responses: {
          "200": {
            description: "Realization view data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        metric: { $ref: "#/components/schemas/RealizationMetric" },
                        years: { type: "array", items: { type: "integer" } },
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              year: { type: "integer" },
                              target: { type: "object" },
                              realizations: { type: "array", items: { type: "object" } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/realizations/{type}/{id}/detail": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["ComponentRealization"],
        summary: "Get Realization Detail for Component or IKU",
        description: "Returns metric data, realization result, and mapped documents using the realization ID.",
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["component", "iku"] },
            description: "Metric type (component or iku)",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Realization ID (idRealization for component, idResult for iku)",
          },
        ],
        responses: {
          "200": {
            description: "Realization detail data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        metric: { $ref: "#/components/schemas/RealizationMetric" },
                        realization: { type: "object", nullable: true, description: "ComponentRealization or IkuResult object including documents" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/dashboard/iku": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["Dashboard"],
        summary: "Get IKU Dashboard Data (Target vs Realization)",
        description: "Returns dashboard data suitable for charts (1 graphic per IKU) grouped by Year/Quarter.",
        parameters: [
          {
            name: "year",
            in: "query",
            required: true,
            schema: { type: "integer" },
            description: "Year to fetch the dashboard data for",
          },
        ],
        responses: {
          "200": {
            description: "Dashboard Data",
            content: {
              "application/json": {
                schema: { 
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          ikuId: { type: "string" },
                          ikuCode: { type: "string" },
                          ikuName: { type: "string" },
                          chartData: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                period: { type: "string" },
                                target: { type: "number", nullable: true },
                                realization: { type: "number", nullable: true },
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/dashboard/component": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["Dashboard"],
        summary: "Get Component Dashboard Data (Target vs Realization)",
        description: "Returns dashboard data suitable for charts for components, filtered by year and optionally by component ID.",
        parameters: [
          {
            name: "year",
            in: "query",
            required: true,
            schema: { type: "integer" },
            description: "Year to fetch the dashboard data for",
          },
          {
            name: "component_id",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
            description: "Optional component ID to filter the dashboard data",
          },
        ],
        responses: {
          "200": {
            description: "Dashboard Data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      oneOf: [
                        {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              componentId: { type: "string" },
                              componentCode: { type: "string" },
                              componentName: { type: "string" },
                              chartData: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    period: { type: "string" },
                                    target: { type: "number", nullable: true },
                                    realization: { type: "number", nullable: true },
                                  },
                                },
                              },
                            },
                          },
                        },
                        {
                          type: "object",
                          properties: {
                            componentId: { type: "string" },
                            componentCode: { type: "string" },
                            componentName: { type: "string" },
                            chartData: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  period: { type: "string" },
                                  target: { type: "number", nullable: true },
                                  realization: { type: "number", nullable: true },
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
          "404": {
            description: "Component not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/documents/upload": {
      post: {
        tags: ["Document"],
        summary: "Upload multiple documents",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Documents uploaded successfully",
            content: {
              "application/json": {
                schema: { 
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Document" } },
                  }
                },
              },
            },
          },
        },
      },
    },
    "/api/documents": {
      get: {
        tags: ["Document"],
        summary: "List all uploaded documents",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 }, description: "Items per page" },
        ],
        responses: {
          "200": {
            description: "Paginated list of documents",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Document" } },
                        pagination: {
                          type: "object",
                          properties: {
                            page: { type: "integer" },
                            limit: { type: "integer" },
                            total: { type: "integer" },
                            totalPages: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/documents/{id}": {
      delete: {
        tags: ["Document"],
        summary: "Delete a document",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Document deleted" }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
              examples: {
                sample: {
                  value: { email: "user@example.com", password: "Secret123", name: "Jane Doe" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingleUser" },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and obtain a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              examples: {
                sample: {
                  value: { email: "user@example.com", password: "Secret123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseAuth" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/ikus": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["IKU"],
        summary: "List IKUs",
        description: "Returns a paginated list of IKU records.",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number (1-based)",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Number of items per page",
          },
        ],
        responses: {
          "200": {
            description: "List of IKU records",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseList" },
              },
            },
          },
        },
      },
      post: {
        tags: ["IKU"],
        summary: "Create a new IKU",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IkuCreate" },
              examples: {
                sample: {
                  value: { code: "IKU001", name: "Water Quality Index", description: "Indicator for measuring water quality", isDirectInput: false, unit: "percentage" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "IKU created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingle" },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
        },
      },
    },
    "/api/ikus/{id}": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["IKU"],
        summary: "Get an IKU by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "IKU id",
          },
        ],
        responses: {
          "200": {
            description: "IKU details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingle" },
              },
            },
          },
          "404": {
            description: "IKU not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["IKU"],
        summary: "Update an IKU",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "IKU id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IkuUpdate" },
              examples: {
                sample: {
                  value: { code: "IKU001", name: "Updated name", description: "Updated description", isDirectInput: true, unit: "file" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "IKU updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingle" },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
          "404": {
            description: "IKU not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["IKU"],
        summary: "Delete an IKU",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "IKU id",
          },
        ],
        responses: {
          "200": {
            description: "IKU deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "IKU deleted successfully" },
                  },
                },
              },
            },
          },
          "404": {
            description: "IKU not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/ikus/{id}/formulas": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["IKU"],
        summary: "List formulas for a given IKU",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "IKU id",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number (1-based)",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Number of items per page",
          },
          {
            name: "includeInactive",
            in: "query",
            schema: { type: "boolean" },
            description: "Include inactive formulas",
          },
        ],
        responses: {
          "200": {
            description: "List of formulas for the IKU",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseListFormula" },
              },
            },
          },
          "404": {
            description: "IKU not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/ikus/{id}/components": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["IKU"],
        summary: "List components mapped to an IKU",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "IKU id",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number (1-based)",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Number of items per page",
          },
        ],
        responses: {
          "200": {
            description: "List of components mapped to the IKU",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseListComponent" },
              },
            },
          },
          "404": {
            description: "IKU not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["IKU"],
        summary: "Map a component to an IKU",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "IKU id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IkuComponentMapping" },
              examples: {
                sample: {
                  value: { componentId: "COMPONENT_UUID" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Component mapped to IKU successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingleIKUComponent" },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
          "404": {
            description: "IKU or component not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/ikus/{id}/components/{componentId}": {
      delete: {
        tags: ["IKU"],
        summary: "Unmap a component from an IKU",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "IKU id",
          },
          {
            name: "componentId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Component id",
          },
        ],
        responses: {
          "200": {
            description: "Component unmapped from IKU successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Component unmapped from IKU successfully" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Mapping not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/components": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["Component"],
        summary: "List Components",
        description: "Returns a paginated list of Component records.",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number (1-based)",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Number of items per page",
          },
          {
            name: "name",
            in: "query",
            schema: { type: "string" },
            description: "Filter components by name (substring match)",
          },
          {
            name: "tag",
            in: "query",
            schema: { type: "string" },
            description: "Filter components by tag name (substring match)",
          },
        ],
        responses: {
          "200": {
            description: "List of Component records",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseListComponent" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Component"],
        summary: "Create a new Component",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ComponentCreate" },
              examples: {
                sample: {
                  value: {
                    code: "COMP001",
                    name: "Example Component",
                    description: "Component for measuring something",
                    dataType: "number",
                    sourceType: "manual",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Component created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingleComponent" },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
        },
      },
    },
    "/api/components/{id}": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["Component"],
        summary: "Get a Component by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Component id",
          },
        ],
        responses: {
          "200": {
            description: "Component details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingleComponent" },
              },
            },
          },
          "404": {
            description: "Component not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Component"],
        summary: "Update a Component",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Component id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ComponentUpdate" },
              examples: {
                sample: {
                  value: {
                    code: "COMP001",
                    name: "Updated component name",
                    description: "Updated description",
                    dataType: "percentage",
                    sourceType: "api",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Component updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingleComponent" },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
          "404": {
            description: "Component not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Component"],
        summary: "Delete a Component",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Component id",
          },
        ],
        responses: {
          "200": {
            description: "Component deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Component deleted successfully" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Component not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/iku-formulas": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["Formula"],
        summary: "List IKU formulas",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number (1-based)",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Number of items per page",
          },
          {
            name: "ikuId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter formulas by IKU id",
          },
          {
            name: "includeInactive",
            in: "query",
            schema: { type: "boolean", default: false },
            description: "Include inactive formulas in the results",
          },
        ],
        responses: {
          "200": {
            description: "List of IKU formulas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseListFormula" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Formula"],
        summary: "Create an IKU formula",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IkuFormulaCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Formula created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingleFormula" },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
        },
      },
    },
    "/api/iku-formulas/{id}": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["Formula"],
        summary: "Get an IKU formula by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
        ],
        responses: {
          "200": {
            description: "Formula details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingleFormula" },
              },
            },
          },
          "404": {
            description: "Formula not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Formula"],
        summary: "Update an IKU formula",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IkuFormulaUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Formula updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponseSingleFormula" },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
          "404": {
            description: "Formula not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Formula"],
        summary: "Delete an IKU formula",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
        ],
        responses: {
          "200": {
            description: "Formula deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Formula deleted successfully" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Formula not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/iku-formulas/{id}/components": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["Formula"],
        summary: "List components used by a formula",
        description: "Returns full component records referenced by the formula steps",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
        ],
        responses: {
          "200": {
            description: "Components used by the formula",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FormulaComponentList" },
              },
            },
          },
          "404": {
            description: "Formula not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/iku-formulas/{id}/test": {
      security: [{ bearerAuth: [] }],
      post: {
        tags: ["Formula"],
        summary: "Evaluate a formula with provided component values",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FormulaTestRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Formula evaluation result",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FormulaTestResponse" },
              },
            },
          },
          "400": {
            description: "Validation or execution error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
          "404": {
            description: "Formula not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/iku-formulas/{formulaId}/steps": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["Formula"],
        summary: "List formula steps",
        parameters: [
          {
            name: "formulaId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
        ],
        responses: {
          "200": {
            description: "List of formula steps",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/IkuFormulaDetail" },
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Formula not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Formula"],
        summary: "Create a new formula step",
        parameters: [
          {
            name: "formulaId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IkuFormulaDetail" },
            },
          },
        },
        responses: {
          "201": {
            description: "Formula step created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Formula step created successfully" },
                    data: { $ref: "#/components/schemas/IkuFormulaDetail" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
          "404": {
            description: "Formula not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/iku-formulas/{formulaId}/steps/batch": {
      security: [{ bearerAuth: [] }],
      post: {
        tags: ["Formula"],
        summary: "Create multiple formula steps",
        parameters: [
          {
            name: "formulaId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/IkuFormulaDetailCreate" },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Formula steps created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Formula steps created successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/IkuFormulaDetail" },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
          "404": {
            description: "Formula not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Formula"],
        summary: "Update multiple formula steps",
        parameters: [
          {
            name: "formulaId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/IkuFormulaDetailUpdate" },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Formula steps updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Formula steps updated successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/IkuFormulaDetail" },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
          "404": {
            description: "Formula not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/iku-formulas/{formulaId}/steps/{id}": {
      security: [{ bearerAuth: [] }],
      put: {
        tags: ["Formula"],
        summary: "Update a formula step",
        parameters: [
          {
            name: "formulaId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Step id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IkuFormulaDetail" },
            },
          },
        },
        responses: {
          "200": {
            description: "Formula step updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Formula step updated successfully" },
                    data: { $ref: "#/components/schemas/IkuFormulaDetail" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation or business error",
            content: {
              "application/json": {
                schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] },
              },
            },
          },
          "404": {
            description: "Formula or step not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Formula"],
        summary: "Delete a formula step",
        parameters: [
          {
            name: "formulaId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Formula id",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Step id",
          },
        ],
        responses: {
          "200": {
            description: "Formula step deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Formula step deleted successfully" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Formula or step not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BusinessErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/component-realizations": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["ComponentRealization"],
        summary: "List component realizations",
        parameters: [
          { name: "idComponent", in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by component ID" },
          { name: "month", in: "query", schema: { type: "integer", minimum: 1, maximum: 12 }, description: "Filter by month" },
          { name: "year", in: "query", schema: { type: "integer" }, description: "Filter by year" },
          { name: "tagId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by tag — hanya tampilkan realisasi komponen yang memiliki tag ini" },
        ],
        responses: { "200": { description: "List records", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/ComponentRealization" } } } } } } } },
      },
      post: {
        tags: ["ComponentRealization"],
        summary: "Create or update a component realization",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ComponentRealizationCreate" } } } },
        responses: { "201": { description: "Created or updated", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/ComponentRealization" } } } } } }, "400": { description: "Validation error, or no isFinal formula found for IKU", content: { "application/json": { schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] } } } } },
      },
    },
    "/api/component-realizations/{id}": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["ComponentRealization"],
        summary: "Get component realization by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }}],
        responses: { "200": { description: "Details", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/ComponentRealization" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
      put: {
        tags: ["ComponentRealization"],
        summary: "Update component realization value",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }}],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ComponentRealizationUpdate" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/ComponentRealization" } } } } } }, "400": { description: "Validation error, or no isFinal formula found for IKU", content: { "application/json": { schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
      delete: {
        tags: ["ComponentRealization"],
        summary: "Delete component realization",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }}],
        responses: { "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
    },
    "/api/iku-results": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["IKUResult"],
        summary: "List IKU results",
        parameters: [
          { name: "idIku", in: "query", schema: { type: "string" } },
          { name: "month", in: "query", schema: { type: "integer" } },
          { name: "year", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "List results", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/IkuResult" } } } } } } } },
      },
      post: {
        tags: ["IKUResult"],
        summary: "Create or update an IKU result",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/IkuResultCreate" } } } },
        responses: { "201": { description: "Created or updated", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/IkuResult" } } } } } }, "400": { description: "Validation or business error", content: { "application/json": { schema: { oneOf: [{ $ref: "#/components/schemas/ValidationErrorResponse" }, { $ref: "#/components/schemas/BusinessErrorResponse" }] } } } } },
      },
    },
    "/api/iku-results/{id}": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["IKUResult"],
        summary: "Get IKU result by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }}],
        responses: { "200": { description: "Details", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/IkuResult" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
      put: {
        tags: ["IKUResult"],
        summary: "Update IKU result",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }}],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/IkuResultUpdate" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/IkuResult" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
      delete: {
        tags: ["IKUResult"],
        summary: "Delete IKU result",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }}],
        responses: { "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
    },
    "/api/iku-targets": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["IKUTarget"],
        summary: "List IKU targets",
        parameters: [
          { name: "ikuId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "year", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "List records", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/IkuTarget" } } } } } } } },
      },
      post: {
        tags: ["IKUTarget"],
        summary: "Create an IKU target",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/IkuTargetCreate" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/IkuTarget" } } } } } }, "400": { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
    },
    "/api/iku-targets/{id}": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["IKUTarget"],
        summary: "Get IKU target by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Details", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/IkuTarget" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
      put: {
        tags: ["IKUTarget"],
        summary: "Update IKU target",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/IkuTargetUpdate" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/IkuTarget" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
      delete: {
        tags: ["IKUTarget"],
        summary: "Delete IKU target",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
    },
    "/api/component-targets": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["ComponentTarget"],
        summary: "List component targets",
        parameters: [
          { name: "componentId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "year", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "List records", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/ComponentTarget" } } } } } } } },
      },
      post: {
        tags: ["ComponentTarget"],
        summary: "Create a component target",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ComponentTargetCreate" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/ComponentTarget" } } } } } }, "400": { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
    },
    "/api/component-targets/{id}": {
      security: [{ bearerAuth: [] }],
      get: {
        tags: ["ComponentTarget"],
        summary: "Get component target by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Details", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/ComponentTarget" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
      put: {
        tags: ["ComponentTarget"],
        summary: "Update component target",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ComponentTargetUpdate" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/ComponentTarget" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
      delete: {
        tags: ["ComponentTarget"],
        summary: "Delete component target",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } } },
      },
    },

    // ─── TAG CRUD ─────────────────────────────────────────────────────────────
    "/api/tags": {
      get: {
        tags: ["Tag"],
        summary: "List all tags",
        parameters: [
          { name: "name", in: "query", schema: { type: "string" }, description: "Filter by name (partial match)" },
          { name: "includeDeleted", in: "query", schema: { type: "boolean", default: false }, description: "Include soft-deleted tags" },
        ],
        responses: {
          "200": {
            description: "List of tags",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Tag" } } } } } },
          },
        },
      },
      post: {
        tags: ["Tag"],
        summary: "Create a new tag",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/TagCreate" }, examples: { sample: { value: { name: "Prioritas Nasional", color: "#3B82F6" } } } } },
        },
        responses: {
          "201": { description: "Tag created", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Tag" } } } } } },
          "400": { description: "Validation or duplicate name", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
        },
      },
    },
    "/api/tags/{id}": {
      get: {
        tags: ["Tag"],
        summary: "Get tag by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Tag details with associated components", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Tag" } } } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
        },
      },
      put: {
        tags: ["Tag"],
        summary: "Update a tag",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TagUpdate" } } } },
        responses: {
          "200": { description: "Tag updated", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Tag" } } } } } },
          "400": { description: "Duplicate name", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
        },
      },
      delete: {
        tags: ["Tag"],
        summary: "Soft-delete a tag",
        description: "Sets deletedAt timestamp. Tag akan disembunyikan dari semua list dan tidak bisa di-assign ke component baru.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Tag soft-deleted" },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
        },
      },
    },

    // ─── COMPONENT TAG MANAGEMENT ─────────────────────────────────────────────
    "/api/components/{id}/tags": {
      get: {
        tags: ["Tag"],
        summary: "List tags assigned to a component",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "Component ID" }],
        responses: {
          "200": { description: "List of tags", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Tag" } } } } } } },
          "404": { description: "Component not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
        },
      },
      post: {
        tags: ["Tag"],
        summary: "Assign a tag to a component",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "Component ID" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { tagId: { type: "string", format: "uuid" } }, required: ["tagId"] } } },
        },
        responses: {
          "201": { description: "Tag assigned", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } } },
          "400": { description: "Already assigned or invalid tagId", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
          "404": { description: "Component or tag not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
        },
      },
    },
    "/api/components/{id}/tags/{tagId}": {
      delete: {
        tags: ["Tag"],
        summary: "Unassign a tag from a component",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "Component ID" },
          { name: "tagId", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "Tag ID" },
        ],
        responses: {
          "200": { description: "Tag unassigned" },
          "404": { description: "Assignment not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
        },
      },
    },

    // ─── COMPONENT REALIZATION VIEW ────────────────────────────────────────────
    "/api/components/{id}/realization": {
      get: {
        tags: ["Component"],
        summary: "Get component realization view (detail + target + realisasi per bulan)",
        description: "Mengembalikan detail komponen, target per kuartal, dan 12 baris realisasi per bulan untuk tahun yang dipilih. Setiap baris realisasi menyertakan id (null jika belum ada) sebagai hint POST vs PUT.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "Component ID" },
          { name: "year", in: "query", schema: { type: "integer", default: 2024 }, description: "Tahun data (default: tahun berjalan)" },
        ],
        responses: {
          "200": {
            description: "Realization view data",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/ComponentRealizationView" } } } } },
          },
          "404": { description: "Component not found", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } } },
        },
      },
    },

    // ─── BULK SAVE REALIZATION ──────────────────────────────────────────────────
    "/api/realizations/{type}/{id}/bulk": {
      security: [{ bearerAuth: [] }],
      post: {
        tags: ["ComponentRealization"],
        summary: "Bulk save realizations for a Component or IKU",
        description: `Upserts multiple realization rows for a given year. \n\n**For type=component:** \`value\` is required. \`month\` must match the component's periodType (0=yearly, 3/6/9/12=quarter, 6/12=semester, 1-12=monthly). Optionally attach \`documentIds\`.\n\n**For type=iku (unit=percentage|number):** \`value\` is required.\n**For type=iku (unit=text):** \`metadata.text\` (string) is required.\n**For type=iku (unit=file):** \`metadata.files\` (array) is required.`,
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["component", "iku"] },
            description: "Metric type",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Metric ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["year", "realizations"],
                properties: {
                  year: { type: "integer", minimum: 2000, description: "Realization year" },
                  realizations: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["month"],
                      properties: {
                        month: { type: "integer", minimum: 0, maximum: 12, description: "0=yearly, 3/6/9/12=quarter, 6/12=semester, 1-12=monthly" },
                        value: { type: "number", nullable: true, description: "Numeric value (required for component and IKU unit=percentage|number)" },
                        metadata: {
                          type: "object",
                          nullable: true,
                          description: "For IKU unit=text: { text: string }; for IKU unit=file: { files: [{ documentId, name }] }",
                          properties: {
                            text: { type: "string" },
                            files: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  documentId: { type: "string", format: "uuid" },
                                  name: { type: "string" },
                                },
                              },
                            },
                          },
                        },
                        documentIds: {
                          type: "array",
                          items: { type: "string", format: "uuid" },
                          description: "For type=component only: attach document IDs",
                        },
                      },
                    },
                  },
                },
              },
              examples: {
                componentBulk: {
                  summary: "Bulk save component realizations (monthly)",
                  value: {
                    year: 2025,
                    realizations: [
                      { month: 1, value: 85.5 },
                      { month: 2, value: 90.0 },
                      { month: 3, value: 88.3, documentIds: ["uuid-doc-1"] },
                    ],
                  },
                },
                ikuNumericBulk: {
                  summary: "Bulk save IKU results (unit=percentage)",
                  value: {
                    year: 2025,
                    realizations: [{ month: 0, value: 75.0 }],
                  },
                },
                ikuTextBulk: {
                  summary: "Bulk save IKU results (unit=text)",
                  value: {
                    year: 2025,
                    realizations: [{ month: 0, metadata: { text: "Laporan sudah selesai" } }],
                  },
                },
                ikuFileBulk: {
                  summary: "Bulk save IKU results (unit=file)",
                  value: {
                    year: 2025,
                    realizations: [{ month: 0, metadata: { files: [{ documentId: "uuid-doc-1", name: "laporan.pdf" }] } }],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Bulk save successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Bulk save component realizations successful" },
                    data: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error (invalid month for periodType, missing value/metadata)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } },
          },
          "404": {
            description: "Component or IKU not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessErrorResponse" } } },
          },
        },
      },
    },

    // ─── IMPORT MASTER DATA ────────────────────────────────────────────────
    "/api/import/master/template": {
      get: {
        tags: ["Import"],
        summary: "Download Excel template for master data import (IKU, IKP, Mapping)",
        description: "Returns an .xlsx file with the correct column headers for importing IKU, Component (IKP), and their mapping.",
        responses: {
          "200": {
            description: "Excel template file (.xlsx)",
            content: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } } },
          },
        },
      },
    },
    "/api/import/master/export": {
      get: {
        tags: ["Import"],
        summary: "Export master data to Excel",
        description: "Returns an .xlsx file containing all existing IKU, Component (IKP), and their mapping data, formatted similarly to the import template.",
        responses: {
          "200": {
            description: "Excel export file (.xlsx)",
            content: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } } },
          },
        },
      },
    },
    "/api/import/master": {
      post: {
        tags: ["Import"],
        summary: "Import master data from Excel",
        description: "Upload an .xlsx file with sheet 'MasterData'. Columns: iku_code, iku_name, iku_description, iku_is_direct_input, iku_unit, ikp_code, ikp_name, ikp_description, ikp_data_type, ikp_source_type, ikp_period_type.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } },
            },
          },
        },
        responses: {
          "200": {
            description: "Import successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        summary: {
                          type: "object",
                          properties: {
                            iku: { type: "integer" },
                            ikp: { type: "integer" },
                            mapping: { type: "object", properties: { created: { type: "integer" }, skipped: { type: "integer" } } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/import/formulas/template": {
      get: {
        tags: ["Import"],
        summary: "Download Excel template for formula import",
        description: "Returns an .xlsx file with columns: iku_code, formula_name, formula_description, formula_expression, final_result_key, is_final.",
        responses: {
          "200": {
            description: "Excel template file (.xlsx)",
            content: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } } },
          },
        },
      },
    },
    "/api/import/formulas/export": {
      get: {
        tags: ["Import"],
        summary: "Export formulas to Excel",
        description: "Returns an .xlsx file containing all existing IKU Formulas, formatted similarly to the import template.",
        responses: {
          "200": {
            description: "Excel export file (.xlsx)",
            content: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } } },
          },
        },
      },
    },
    "/api/import/formulas": {
      post: {
        tags: ["Import"],
        summary: "Import formulas from Excel",
        description: "Upload an .xlsx file with sheet 'FormulaData'. Expressions will be parsed into steps. IKU codes must exist.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } },
            },
          },
        },
        responses: {
          "200": {
            description: "Import successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        summary: { type: "object", properties: { created: { type: "integer" }, errors: { type: "integer" } } },
                        formulaErrors: { type: "array", items: { type: "object" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [],
});
