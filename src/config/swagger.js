import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AstroStar API",
      version: "1.0.0",
      description: "API documentation for AstroStar sports management system",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Role: {
          type: "object",
          required: ["name", "description", "status"],
          properties: {
            id: {
              type: "integer",
              description: "The auto-generated id of the role",
            },
            name: {
              type: "string",
              maxLength: 50,
              description: "The name of the role",
            },
            description: {
              type: "string",
              maxLength: 200,
              description: "The description of the role",
            },
            status: {
              type: "string",
              enum: ["Active", "Inactive"],
              description: "The status of the role",
            },
            permissions: {
              type: "object",
              description: "The permissions object for the role",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The date the role was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "The date the role was last updated",
            },
          },
        },
        RoleInput: {
          type: "object",
          required: ["name", "description", "status"],
          properties: {
            name: {
              type: "string",
              maxLength: 50,
              description: "The name of the role",
            },
            description: {
              type: "string",
              maxLength: 200,
              description: "The description of the role",
            },
            status: {
              type: "string",
              enum: ["Active", "Inactive"],
              description: "The status of the role",
            },
            permissions: {
              type: "object",
              description: "The permissions object for the role",
            },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
            },
            message: {
              type: "string",
              description: "Response message",
            },
            data: {
              type: "object",
              description: "Response data",
            },
            error: {
              type: "string",
              description: "Error message if any",
            },
          },
        },
      },
    },
  },
  apis: ["./src/modules/*/routes/*.routes.js"], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
