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
          required: ["name", "description"],
          properties: {
            id: { type: "integer", description: "The auto-generated id of the role" },
            name: { type: "string", maxLength: 50, description: "The name of the role" },
            description: { type: "string", maxLength: 200, description: "The description of the role" },
            permissions: { type: "object", description: "The permissions object for the role" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        RoleInput: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: { type: "string", maxLength: 50 },
            description: { type: "string", maxLength: 200 },
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
            id: { type: "integer", description: "Provider ID" },
            tipoEntidad: { type: "string", enum: ["juridica", "natural"], description: "Entity type" },
            razonSocial: { type: "string", description: "Business name or full name" },
            nit: { type: "string", description: "Tax ID or identification document" },
            tipoDocumento: { type: "string", description: "Document type ID (for natural persons)" },
            tipoDocumentoNombre: { type: "string", description: "Document type name" },
            contactoPrincipal: { type: "string", description: "Main contact person" },
            correo: { type: "string", format: "email", description: "Email address" },
            telefono: { type: "string", description: "Phone number" },
            direccion: { type: "string", description: "Address" },
            ciudad: { type: "string", description: "City" },
            descripcion: { type: "string", nullable: true, description: "Description" },
            estado: { type: "string", enum: ["Activo", "Inactivo"], description: "Status" },
            createdAt: { type: "string", format: "date-time", description: "Creation date" },
            updatedAt: { type: "string", format: "date-time", description: "Last update date" },
            statusAssignedAt: { type: "string", format: "date-time", description: "Status assignment date" },
            fechaRegistro: { type: "string", format: "date-time", description: "Registration date" },
          },
        },

        ProviderInput: {
          type: "object",
          required: [
            "tipoEntidad",
            "razonSocial",
            "nit",
            "contactoPrincipal",
            "telefono",
            "direccion",
            "ciudad"
          ],
          properties: {
            tipoEntidad: { 
              type: "string", 
              enum: ["juridica", "natural"],
              description: "Entity type: juridica (legal entity) or natural (natural person)"
            },
            razonSocial: { 
              type: "string", 
              minLength: 3,
              maxLength: 200,
              description: "Business name (for juridica) or full name (for natural)"
            },
            nit: { 
              type: "string",
              description: "NIT for juridica (10 digits) or identification document for natural (varies by document type)"
            },
            tipoDocumento: { 
              type: "integer",
              description: "Document type ID (required for natural persons, obtained from /document-types endpoint)"
            },
            contactoPrincipal: { 
              type: "string", 
              minLength: 2,
              maxLength: 150,
              description: "Main contact person name"
            },
            correo: { 
              type: "string", 
              format: "email", 
              maxLength: 150,
              description: "Email address (optional)"
            },
            telefono: { 
              type: "string", 
              minLength: 7,
              maxLength: 20,
              description: "Phone number"
            },
            direccion: { 
              type: "string", 
              minLength: 10,
              maxLength: 200,
              description: "Physical address"
            },
            ciudad: { 
              type: "string", 
              minLength: 2,
              maxLength: 100,
              description: "City name"
            },
            descripcion: { 
              type: "string", 
              maxLength: 500,
              description: "Additional description (optional)"
            },
            estado: { 
              type: "string", 
              enum: ["Activo", "Inactivo"],
              default: "Activo",
              description: "Provider status"
            },
          },
        },

        DocumentType: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Document type ID" },
            name: { type: "string", description: "Document type name" },
            description: { type: "string", description: "Document type description" },
            value: { type: "string", description: "Document type ID as string" },
            label: { type: "string", description: "Document type display name" },
          },
        },

        ProviderStats: {
          type: "object",
          properties: {
            totalProviders: { type: "integer", description: "Total number of providers" },
            activeProviders: { type: "integer", description: "Number of active providers" },
            inactiveProviders: { type: "integer", description: "Number of inactive providers" },
            providersByEntityType: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityType: { type: "string", enum: ["juridica", "natural"] },
                  count: { type: "integer" }
                }
              }
            },
            providersWithPurchases: { type: "integer", description: "Providers with purchases" },
            providersWithoutPurchases: { type: "integer", description: "Providers without purchases" },
          },
        },

        AvailabilityCheck: {
          type: "object",
          properties: {
            available: { type: "boolean", description: "Whether the value is available" },
            message: { type: "string", description: "Message if not available" },
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
