import { z } from 'zod';
import { insertUserSchema, insertAppointmentSchema, insertReviewSchema, insertReportSchema, users, appointments, reviews, reports } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  workers: {
    list: {
      method: 'GET' as const,
      path: '/api/workers' as const,
      input: z.object({
        pincode: z.string().optional(),
        workerType: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/workers/:id' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect & { averageRating?: number }>(),
        404: errorSchemas.notFound,
      },
    },
    toggleAvailability: {
      method: 'PATCH' as const,
      path: '/api/workers/availability' as const,
      input: z.object({ isAvailable: z.boolean() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
  },
  appointments: {
    create: {
      method: 'POST' as const,
      path: '/api/appointments' as const,
      input: insertAppointmentSchema.omit({ userId: true, visitTime: true }),
      responses: {
        201: z.custom<typeof appointments.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/appointments' as const,
      responses: {
        200: z.array(z.custom<typeof appointments.$inferSelect & { user?: typeof users.$inferSelect; worker?: typeof users.$inferSelect }>()),
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/appointments/:id/status' as const,
      input: z.object({
        status: z.enum(["accepted", "rejected", "completed"]),
        visitTime: z.string().optional(), // ISO string
      }),
      responses: {
        200: z.custom<typeof appointments.$inferSelect>(),
      },
    },
  },
  reviews: {
    create: {
      method: 'POST' as const,
      path: '/api/reviews' as const,
      input: insertReviewSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
      },
    },
  },
  reports: {
    create: {
      method: 'POST' as const,
      path: '/api/reports' as const,
      input: insertReportSchema.omit({ reporterId: true }),
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/admin/reports' as const,
      responses: {
        200: z.array(z.custom<typeof reports.$inferSelect & { reporter?: typeof users.$inferSelect; worker?: typeof users.$inferSelect }>()),
      },
    },
  },
  admin: {
    stats: {
      method: 'GET' as const,
      path: '/api/admin/stats' as const,
      responses: {
        200: z.object({
          totalUsers: z.number(),
          totalWorkers: z.number(),
          activeAppointments: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
