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
         Provider: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          description: "ID del proveedor"
        },
        tipoEntidad: {
          type: "string",
          enum: ["juridica", "natural"],
          description: "Tipo de entidad"
        },
        razonSocial: {
          type: "string",
          description: "Razón social o nombre completo"
        },
        nit: {
          type: "string",
          description: "NIT o identificación"
        },
        tipoDocumento: {
          type: "string",
          enum: ["CC", "TI", "CE", "PAS"],
          description: "Tipo de documento (solo para persona natural)"
        },
        contactoPrincipal: {
          type: "string",
          description: "Nombre del contacto principal"
        },
        correo: {
          type: "string",
          description: "Correo electrónico"
        },
        telefono: {
          type: "string",
          description: "Número telefónico"
        },
        direccion: {
          type: "string",
          description: "Dirección completa"
        },
        ciudad: {
          type: "string",
          description: "Ciudad"
        },
        descripcion: {
          type: "string",
          description: "Descripción del proveedor"
        },
        estado: {
          type: "string",
          enum: ["Activo", "Inactivo"],
          description: "Estado del proveedor"
        },
        fechaRegistro: {
          type: "string",
          format: "date-time",
          description: "Fecha de registro"
        }
      }
    },
        TemporaryWorker: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "ID único de la persona temporal"
            },
            firstName: {
              type: "string",
              description: "Nombre de la persona temporal"
            },
            lastName: {
              type: "string",
              description: "Apellido de la persona temporal"
            },
            identification: {
              type: "string",
              description: "Número de identificación"
            },
            email: {
              type: "string",
              format: "email",
              description: "Correo electrónico"
            },
            phone: {
              type: "string",
              description: "Número telefónico"
            },
            birthDate: {
              type: "string",
              format: "date",
              description: "Fecha de nacimiento"
            },
            age: {
              type: "integer",
              description: "Edad calculada"
            },
            address: {
              type: "string",
              description: "Dirección de residencia"
            },
            organization: {
              type: "string",
              description: "Organización a la que pertenece"
            },
            status: {
              type: "string",
              enum: ["Active", "Inactive"],
              description: "Estado de la persona temporal"
            },
            personType: {
              type: "string",
              enum: ["Deportista", "Entrenador", "Participante"],
              description: "Tipo de persona temporal"
            },
            documentTypeId: {
              type: "integer",
              description: "ID del tipo de documento"
            },
            documentType: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" }
              },
              description: "Información del tipo de documento"
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de creación"
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de última actualización"
            }
          }
        },
        CreateTemporaryWorkerRequest: {
          type: "object",
          required: ["firstName", "personType"],
          properties: {
            firstName: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              description: "Nombre de la persona temporal (obligatorio)"
            },
            lastName: {
              type: "string",
              maxLength: 100,
              description: "Apellido de la persona temporal"
            },
            identification: {
              type: "string",
              minLength: 6,
              maxLength: 50,
              description: "Número de identificación"
            },
            email: {
              type: "string",
              format: "email",
              description: "Correo electrónico"
            },
            phone: {
              type: "string",
              pattern: "^\\d{7,15}$",
              description: "Número telefónico (7-15 dígitos)"
            },
            birthDate: {
              type: "string",
              format: "date",
              description: "Fecha de nacimiento"
            },
            age: {
              type: "integer",
              minimum: 0,
              maximum: 120,
              description: "Edad"
            },
            address: {
              type: "string",
              maxLength: 200,
              description: "Dirección de residencia"
            },
            organization: {
              type: "string",
              maxLength: 200,
              description: "Organización a la que pertenece"
            },
            status: {
              type: "string",
              enum: ["Active", "Inactive"],
              default: "Active",
              description: "Estado de la persona temporal"
            },
            personType: {
              type: "string",
              enum: ["Deportista", "Entrenador", "Participante"],
              description: "Tipo de persona temporal (obligatorio)"
            },
            documentTypeId: {
              type: "integer",
              minimum: 1,
              description: "ID del tipo de documento"
            }
          }
        },
        UpdateTemporaryWorkerRequest: {
          type: "object",
          properties: {
            firstName: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              description: "Nombre de la persona temporal"
            },
            lastName: {
              type: "string",
              maxLength: 100,
              description: "Apellido de la persona temporal"
            },
            identification: {
              type: "string",
              minLength: 6,
              maxLength: 50,
              description: "Número de identificación"
            },
            email: {
              type: "string",
              format: "email",
              description: "Correo electrónico"
            },
            phone: {
              type: "string",
              pattern: "^\\d{7,15}$",
              description: "Número telefónico (7-15 dígitos)"
            },
            birthDate: {
              type: "string",
              format: "date",
              description: "Fecha de nacimiento"
            },
            age: {
              type: "integer",
              minimum: 0,
              maximum: 120,
              description: "Edad"
            },
            address: {
              type: "string",
              maxLength: 200,
              description: "Dirección de residencia"
            },
            organization: {
              type: "string",
              maxLength: 200,
              description: "Organización a la que pertenece"
            },
            status: {
              type: "string",
              enum: ["Active", "Inactive"],
              description: "Estado de la persona temporal"
            },
            personType: {
              type: "string",
              enum: ["Deportista", "Entrenador", "Participante"],
              description: "Tipo de persona temporal"
            },
            documentTypeId: {
              type: "integer",
              minimum: 1,
              description: "ID del tipo de documento"
            }
          }
        },
        DocumentType: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "ID del tipo de documento"
            },
            name: {
              type: "string",
              description: "Nombre del tipo de documento"
            }
          }
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              description: "Página actual"
            },
            limit: {
              type: "integer",
              description: "Elementos por página"
            },
            total: {
              type: "integer",
              description: "Total de elementos"
            },
            totalPages: {
              type: "integer",
              description: "Total de páginas"
            },
            hasNext: {
              type: "boolean",
              description: "Indica si hay página siguiente"
            },
            hasPrev: {
              type: "boolean",
              description: "Indica si hay página anterior"
            }
          }
        },
      },
      responses: {
        BadRequest: {
          description: "Solicitud incorrecta - Error de validación",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false
                  },
                  message: {
                    type: "string",
                    example: "Errores de validación"
                  },
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                        value: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        NotFound: {
          description: "Recurso no encontrado",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false
                  },
                  message: {
                    type: "string",
                    example: "Persona temporal no encontrada."
                  }
                }
              }
            }
          }
        },
        InternalServerError: {
          description: "Error interno del servidor",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false
                  },
                  message: {
                    type: "string",
                    example: "Error interno del servidor."
                  },
                  error: {
                    type: "string",
                    description: "Detalles del error (solo en desarrollo)"
                  }
                }
              }
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
  },
  apis: [
    "./src/modules/*/routes/*.routes.js",           // Módulos directos como Roles
    "./src/modules/Services/*/routes/*.routes.js",  // Módulos dentro de Services como Employees
    "./src/modules/Athletes/*/temporaryworkers.routes.js" // Módulo de TemporaryWorkers
  ], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
