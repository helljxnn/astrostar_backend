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
            id: { type: "integer", description: "The auto-generated id of the role" },
            name: { type: "string", maxLength: 50, description: "The name of the role" },
            description: { type: "string", maxLength: 200, description: "The description of the role" },
            status: { type: "string", enum: ["Active", "Inactive"], description: "The status of the role" },
            permissions: { type: "object", description: "The permissions object for the role" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        RoleInput: {
          type: "object",
          required: ["name", "description", "status"],
          properties: {
            name: { type: "string", maxLength: 50 },
            description: { type: "string", maxLength: 200 },
            status: { type: "string", enum: ["Active", "Inactive"] },
            permissions: { type: "object" },
          },
        },

        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: "object" },
            error: { type: "string" },
          },
        },

        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            status: { type: "string", enum: ["Active", "Inactive", "Suspended"] },
            role: { $ref: "#/components/schemas/Role" },
            documentType: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } },
            athlete: { type: "object" },
            employee: { type: "object" },
            userType: { type: "string", enum: ["user", "athlete", "employee"] },
            summary: {
              type: "object",
              properties: {
                fullName: { type: "string" },
                type: { type: "string" },
                status: { type: "string" },
                role: { type: "string" },
                hasLogin: { type: "boolean" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        Provider: {
          type: "object",
          properties: {
            id: { type: "integer" },
            tipoEntidad: { type: "string", enum: ["juridica", "natural"] },
            razonSocial: { type: "string" },
            nit: { type: "string" },
            tipoDocumento: { type: "string", enum: ["CC", "TI", "CE", "PAS"] },
            contactoPrincipal: { type: "string" },
            correo: { type: "string" },
            telefono: { type: "string" },
            direccion: { type: "string" },
            ciudad: { type: "string" },
            descripcion: { type: "string" },
            estado: { type: "string", enum: ["Activo", "Inactivo"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            statusAssignedAt: { type: "string", format: "date-time" },
            fechaRegistro: { type: "string", format: "date-time" },
            documentos: { type: "string", nullable: true },
            terminosPago: { type: "string", nullable: true },
            servicios: { type: "string", nullable: true },
            observaciones: { type: "string", nullable: true },
          },
        },

        ProviderInput: {
          type: "object",
          required: [
            "tipoEntidad",
            "razonSocial",
            "nit",
            "contactoPrincipal",
            "correo",
            "telefono",
            "direccion",
            "ciudad",
            "estado",
          ],
          properties: {
            tipoEntidad: { type: "string", enum: ["juridica", "natural"] },
            razonSocial: { type: "string", maxLength: 200 },
            nit: { type: "string" },
            tipoDocumento: { type: "string", enum: ["CC", "TI", "CE", "PAS"] },
            contactoPrincipal: { type: "string", maxLength: 150 },
            correo: { type: "string", format: "email", maxLength: 150 },
            telefono: { type: "string", maxLength: 15 },
            direccion: { type: "string", maxLength: 200 },
            ciudad: { type: "string", maxLength: 100 },
            descripcion: { type: "string", maxLength: 500 },
            estado: { type: "string", enum: ["Activo", "Inactivo"] },
          },
        },
      },

      responses: {
        BadRequest: {
          description: "Solicitud incorrecta - Error de validación",
        },
        NotFound: {
          description: "Recurso no encontrado",
        },
        InternalServerError: {
          description: "Error interno del servidor",
        },
      },

      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: [
     "./src/modules/**/routes/*.js",      
  ],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
