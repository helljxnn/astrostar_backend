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
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "ID del usuario"
            },
            firstName: {
              type: "string",
              description: "Nombre del usuario"
            },
            lastName: {
              type: "string",
              description: "Apellido del usuario"
            },
            email: {
              type: "string",
              description: "Email del usuario"
            },
            status: {
              type: "string",
              enum: ["Active", "Inactive", "Suspended"],
              description: "Estado del usuario"
            },
            role: {
              $ref: '#/components/schemas/Role'
            },
            documentType: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" }
              }
            },
            athlete: {
              type: "object",
              description: "Datos de atleta si aplica"
            },
            employee: {
              type: "object",
              description: "Datos de empleado si aplica"
            },
            userType: {
              type: "string",
              enum: ["user", "athlete", "employee"],
              description: "Tipo de usuario"
            },
            summary: {
              type: "object",
              properties: {
                fullName: { type: "string" },
                type: { type: "string" },
                status: { type: "string" },
                role: { type: "string" },
                hasLogin: { type: "boolean" }
              }
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        // PROVEEDORES
        Provider: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Provider ID" },
            tipoEntidad: { type: "string", enum: ["juridica", "natural"], description: "Entity type" },
            razonSocial: { type: "string", description: "Business name or full name" },
            nit: { type: "string", description: "Tax ID (NIT) or personal ID" },
            tipoDocumento: {
              type: "string",
              enum: ["CC", "TI", "CE", "PAS"],
              description: "Document type (only for natural person)",
            },
            contactoPrincipal: { type: "string", description: "Main contact" },
            correo: { type: "string", description: "Email" },
            telefono: { type: "string", description: "Phone" },
            direccion: { type: "string", description: "Address" },
            ciudad: { type: "string", description: "City" },
            descripcion: { type: "string", description: "Description" },
            estado: { type: "string", enum: ["Activo", "Inactivo"], description: "Status" },
            createdAt: { type: "string", format: "date-time", description: "Creation date" },
            updatedAt: { type: "string", format: "date-time", description: "Last update" },
            statusAssignedAt: { type: "string", format: "date-time", description: "Status assignment date" },
            fechaRegistro: { type: "string", format: "date-time", description: "Registration date" },
            documentos: { type: "string", nullable: true, description: "Attached documents" },
            terminosPago: { type: "string", nullable: true, description: "Payment terms" },
            servicios: { type: "string", nullable: true, description: "Services offered" },
            observaciones: { type: "string", nullable: true, description: "Observations" },
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
            tipoEntidad: { type: "string", enum: ["juridica", "natural"], description: "Entity type" },
            razonSocial: { type: "string", maxLength: 200, description: "Business name or full name" },
            nit: { type: "string", description: "Tax ID (NIT) or personal ID" },
            tipoDocumento: {
              type: "string",
              enum: ["CC", "TI", "CE", "PAS"],
              description: "Document type (only for natural person)",
            },
            contactoPrincipal: { type: "string", maxLength: 150, description: "Main contact" },
            correo: { type: "string", format: "email", maxLength: 150, description: "Email" },
            telefono: { type: "string", maxLength: 15, description: "Phone" },
            direccion: { type: "string", maxLength: 200, description: "Address" },
            ciudad: { type: "string", maxLength: 100, description: "City" },
            descripcion: { type: "string", maxLength: 500, description: "Description" },
            estado: { type: "string", enum: ["Activo", "Inactivo"], description: "Status" },
          },
        },
      },
    },
  },
  apis: [
    "./src/modules/*/routes/*.routes.js",
    "./src/modules/Services/*/routes/*.routes.js"  
  ],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };