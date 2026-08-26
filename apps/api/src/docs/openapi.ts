export const openApiDocument = {
  openapi: "3.0.3",

  info: {
    title: "Hyrd API",
    version: "0.1.0",
    description: "REST API for the Hyrd personal job-application tracker.",
  },

  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],

  tags: [
    {
      name: "System",
      description: "API health and system endpoints",
    },
    {
      name: "Applications",
      description: "Job-application management",
    },
  ],

  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Check API health",

        responses: {
          "200": {
            description: "The API is running",

            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status", "service"],

                  properties: {
                    status: {
                      type: "string",
                      example: "ok",
                    },

                    service: {
                      type: "string",
                      example: "hyrd-api",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/applications": {
      get: {
        tags: ["Applications"],
        summary: "List job applications",

        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              $ref: "#/components/schemas/ApplicationStatus",
            },
          },
          {
            name: "search",
            in: "query",
            schema: {
              type: "string",
              maxLength: 100,
            },
          },
          {
            name: "sortBy",
            in: "query",
            schema: {
              type: "string",
              enum: ["createdAt", "appliedAt", "company"],
              default: "createdAt",
            },
          },
          {
            name: "sortOrder",
            in: "query",
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
          },
          {
            name: "page",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              default: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
        ],

        responses: {
          "200": {
            description: "Paginated application list",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApplicationList",
                },
              },
            },
          },

          "400": {
            description: "Invalid query parameters",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },

      post: {
        tags: ["Applications"],
        summary: "Create a job application",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateApplicationInput",
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Application created",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/JobApplication",
                },
              },
            },
          },

          "400": {
            description: "Invalid application data",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },

    "/api/applications/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Application UUID",

          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],

      get: {
        tags: ["Applications"],
        summary: "Retrieve one application",

        responses: {
          "200": {
            description: "Application found",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/JobApplication",
                },
              },
            },
          },

          "400": {
            description: "Invalid application UUID",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },

          "404": {
            description: "Application not found",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },

      patch: {
        tags: ["Applications"],
        summary: "Update an application",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateApplicationInput",
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Application updated",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/JobApplication",
                },
              },
            },
          },

          "400": {
            description: "Invalid ID or update data",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },

          "404": {
            description: "Application not found",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },

      delete: {
        tags: ["Applications"],
        summary: "Delete an application",

        responses: {
          "204": {
            description: "Application deleted",
          },

          "400": {
            description: "Invalid application UUID",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },

          "404": {
            description: "Application not found",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
  },

  components: {
    schemas: {
      ApplicationStatus: {
        type: "string",
        enum: [
          "saved",
          "applied",
          "screening",
          "interview",
          "assessment",
          "offer",
          "rejected",
          "withdrawn",
        ],
      },

      JobApplication: {
        type: "object",

        required: [
          "id",
          "company",
          "position",
          "status",
          "createdAt",
          "updatedAt",
        ],

        properties: {
          id: {
            type: "string",
            format: "uuid",
          },

          company: {
            type: "string",
            example: "IBM",
          },

          position: {
            type: "string",
            example: "Software Developer",
          },

          status: {
            $ref: "#/components/schemas/ApplicationStatus",
          },

          location: {
            type: "string",
            example: "Quezon City",
          },

          jobUrl: {
            type: "string",
            format: "uri",
          },

          notes: {
            type: "string",
          },

          appliedAt: {
            type: "string",
            format: "date-time",
          },

          createdAt: {
            type: "string",
            format: "date-time",
          },

          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      CreateApplicationInput: {
        type: "object",
        additionalProperties: false,
        required: ["company", "position"],

        properties: {
          company: {
            type: "string",
            minLength: 1,
            example: "IBM",
          },

          position: {
            type: "string",
            minLength: 1,
            example: "Software Developer",
          },

          status: {
            $ref: "#/components/schemas/ApplicationStatus",
          },

          location: {
            type: "string",
            example: "Quezon City",
          },

          jobUrl: {
            type: "string",
            format: "uri",
          },

          notes: {
            type: "string",
          },

          appliedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      UpdateApplicationInput: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,

        properties: {
          company: {
            type: "string",
            minLength: 1,
          },

          position: {
            type: "string",
            minLength: 1,
          },

          status: {
            $ref: "#/components/schemas/ApplicationStatus",
          },

          location: {
            type: "string",
            minLength: 1,
          },

          jobUrl: {
            type: "string",
            format: "uri",
          },

          notes: {
            type: "string",
          },

          appliedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      ApplicationList: {
        type: "object",
        required: ["data", "pagination"],

        properties: {
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/JobApplication",
            },
          },

          pagination: {
            type: "object",
            required: ["page", "limit", "total", "totalPages"],

            properties: {
              page: {
                type: "integer",
                example: 1,
              },

              limit: {
                type: "integer",
                example: 20,
              },

              total: {
                type: "integer",
                example: 37,
              },

              totalPages: {
                type: "integer",
                example: 2,
              },
            },
          },
        },
      },

      Error: {
        type: "object",
        required: ["error"],

        properties: {
          error: {
            type: "string",
            example: "Application not found",
          },
        },
      },
    },
  },
} as const;
