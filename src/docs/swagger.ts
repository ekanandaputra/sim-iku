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
        },
        required: ["code", "name"],
      },
      IkuUpdate: {
        type: "object",
        properties: {
          code: { type: "string", maxLength: 50 },
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
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
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "code", "name", "dataType", "sourceType"],
      },
      ComponentCreate: {
        type: "object",
        properties: {
          code: { type: "string", maxLength: 50 },
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
          dataType: { type: "string", enum: ["number", "percentage", "integer"] },
          sourceType: { type: "string", enum: ["database", "api", "manual"] },
        },
        required: ["code", "name", "dataType", "sourceType"],
      },
      ComponentUpdate: {
        type: "object",
        properties: {
          code: { type: "string", maxLength: 50 },
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
          dataType: { type: "string", enum: ["number", "percentage", "integer"] },
          sourceType: { type: "string", enum: ["database", "api", "manual"] },
        },
        required: ["code", "name", "dataType", "sourceType"],
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
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "ikuId", "name", "finalResultKey", "isActive"],
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
        },
        required: ["ikuId", "name"],
      },
      IkuFormulaUpdate: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 500 },
          finalResultKey: { type: "string", maxLength: 100 },
          isActive: { type: "boolean" },
        },
        required: ["name"],
      },
      IkuFormulaDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          formulaId: { type: "string", format: "uuid" },
          sequence: { type: "integer" },
          leftType: { type: "string", enum: ["component", "constant", "temp"] },
          leftValue: { type: "string" },
          operator: { type: "string", enum: ["ADD", "SUB", "MUL", "DIV"] },
          rightType: { type: "string", enum: ["component", "constant", "temp"] },
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
          leftType: { type: "string", enum: ["component", "constant", "temp"] },
          leftValue: { type: "string" },
          operator: { type: "string", enum: ["ADD", "SUB", "MUL", "DIV"] },
          rightType: { type: "string", enum: ["component", "constant", "temp"] },
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
          leftType: { type: "string", enum: ["component", "constant", "temp"] },
          leftValue: { type: "string" },
          operator: { type: "string", enum: ["ADD", "SUB", "MUL", "DIV"] },
          rightType: { type: "string", enum: ["component", "constant", "temp"] },
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
            items: {
              type: "object",
              properties: { code: { type: "string" } },
            },
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
    },
  },
  paths: {
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
                  value: { code: "IKU001", name: "Water Quality Index", description: "Indicator for measuring water quality" },
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
                  value: { code: "IKU001", name: "Updated name", description: "Updated description" },
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
        summary: "List component codes used by a formula",
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
            description: "Component codes used by the formula",
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
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [],
});
