import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // email
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address").notNull(),
  pincode: text("pincode").notNull(),
  role: text("role", { enum: ["user", "worker", "admin"] }).default("user").notNull(),
  // Worker specific fields (nullable for non-workers to keep it simple single-table if preferred, 
  // but let's use a separate table for cleaner separation if many fields, or just here for simplicity as per "collections" concept)
  // implementing as single table for simplicity of "collections" mapping where documents vary
  workerType: text("worker_type"),
  visitingCharge: integer("visiting_charge"),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // FK to users
  workerId: integer("worker_id").notNull(), // FK to users (who are workers)
  issueDescription: text("issue_description").notNull(),
  address: text("address").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected", "completed"] }).default("pending").notNull(),
  visitTime: timestamp("visit_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull(), // FK to appointments
  workerId: integer("worker_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  reportedWorkerId: integer("reported_worker_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "resolved"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ many }) => ({
  appointmentsAsUser: many(appointments, { relationName: "userAppointments" }),
  appointmentsAsWorker: many(appointments, { relationName: "workerAppointments" }),
  reviewsReceived: many(reviews, { relationName: "workerReviews" }),
  reportsReceived: many(reports, { relationName: "workerReports" }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
    relationName: "userAppointments",
  }),
  worker: one(users, {
    fields: [appointments.workerId],
    references: [users.id],
    relationName: "workerAppointments",
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  worker: one(users, {
    fields: [reviews.workerId],
    references: [users.id],
    relationName: "workerReviews",
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [reviews.appointmentId],
    references: [appointments.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, status: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true, status: true });

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Review = typeof reviews.$inferSelect;
export type Report = typeof reports.$inferSelect;

export type LoginRequest = { username: string; password: string };
export type AuthResponse = User;

// Worker filters
export type WorkerFilters = {
  pincode?: string;
  workerType?: string;
};

// Stats
export type AdminStats = {
  totalUsers: number;
  totalWorkers: number;
  activeAppointments: number;
};
