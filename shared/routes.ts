import { z } from 'zod';
import { insertBookSchema, insertCategorySchema, insertOrderSchema, registerUserSchema, books, users, categories, orders, orderItems, activityLogs, wilayas } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: { 200: z.custom<typeof users.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: { 200: z.void() },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: { 200: z.custom<typeof users.$inferSelect | null>() },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: registerUserSchema,
      responses: { 201: z.custom<typeof users.$inferSelect>(), 400: errorSchemas.validation },
    },
  },
  books: {
    list: {
      method: 'GET' as const,
      path: '/api/books',
      input: z.object({ category: z.string().optional(), search: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof books.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/books/:id',
      responses: { 200: z.custom<typeof books.$inferSelect>(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/books',
      input: insertBookSchema,
      responses: { 201: z.custom<typeof books.$inferSelect>(), 400: errorSchemas.validation, 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/books/:id',
      input: insertBookSchema.partial(),
      responses: { 200: z.custom<typeof books.$inferSelect>(), 400: errorSchemas.validation, 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/books/:id',
      responses: { 204: z.void(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: { 200: z.array(z.custom<typeof categories.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories',
      input: insertCategorySchema,
      responses: { 201: z.custom<typeof categories.$inferSelect>(), 400: errorSchemas.validation, 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/categories/:id',
      input: insertCategorySchema.partial(),
      responses: { 200: z.custom<typeof categories.$inferSelect>(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/categories/:id',
      responses: { 204: z.void(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      responses: { 200: z.array(z.any()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id',
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: insertOrderSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation },
    },
    updateStatus: {
      method: 'PUT' as const,
      path: '/api/orders/:id/status',
      input: z.object({ status: z.string() }),
      responses: { 200: z.any(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/orders/:id',
      responses: { 204: z.void(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
  },
  customers: {
    list: {
      method: 'GET' as const,
      path: '/api/admin/customers',
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/admin/customers/:id',
      responses: { 200: z.any(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
    create: {
      method: 'POST' as const,
      path: '/api/admin/customers',
      input: z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(2), phone: z.string().optional(), address: z.string().optional(), city: z.string().optional() }),
      responses: { 201: z.custom<typeof users.$inferSelect>(), 400: errorSchemas.validation, 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/admin/customers/:id',
      input: z.object({ enabled: z.boolean().optional(), role: z.string().optional(), name: z.string().optional(), phone: z.string().optional(), address: z.string().optional(), city: z.string().optional(), email: z.string().optional() }),
      responses: { 200: z.custom<typeof users.$inferSelect>(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/admin/customers/:id',
      responses: { 204: z.void(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
    orders: {
      method: 'GET' as const,
      path: '/api/admin/customers/:id/orders',
      responses: { 200: z.array(z.any()), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
  },
  shipping: {
    list: {
      method: 'GET' as const,
      path: '/api/shipping/wilayas',
      responses: { 200: z.array(z.custom<typeof wilayas.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/shipping/wilayas/:code',
      responses: { 200: z.custom<typeof wilayas.$inferSelect>(), 404: errorSchemas.notFound },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/admin/shipping/wilayas/:id',
      input: z.object({ shippingPrice: z.string().optional(), isActive: z.boolean().optional() }),
      responses: { 200: z.custom<typeof wilayas.$inferSelect>(), 404: errorSchemas.notFound, 401: errorSchemas.unauthorized },
    },
    bulkUpdate: {
      method: 'PUT' as const,
      path: '/api/admin/shipping/wilayas',
      input: z.object({ defaultPrice: z.string() }),
      responses: { 200: z.object({ updated: z.number() }), 401: errorSchemas.unauthorized },
    },
  },
  profile: {
    get: {
      method: 'GET' as const,
      path: '/api/profile',
      responses: { 200: z.custom<typeof users.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profile',
      input: z.object({ name: z.string().optional(), phone: z.string().optional(), address: z.string().optional(), city: z.string().optional(), password: z.string().optional() }),
      responses: { 200: z.custom<typeof users.$inferSelect>(), 401: errorSchemas.unauthorized },
    },
    orders: {
      method: 'GET' as const,
      path: '/api/profile/orders',
      responses: { 200: z.array(z.any()), 401: errorSchemas.unauthorized },
    },
  },
  activity: {
    list: {
      method: 'GET' as const,
      path: '/api/admin/activity',
      responses: { 200: z.array(z.custom<typeof activityLogs.$inferSelect>()) },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/admin/stats',
      responses: { 200: z.object({ totalBooks: z.number(), totalOrders: z.number(), totalCustomers: z.number(), lowStockBooks: z.number(), revenue: z.number() }) },
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
