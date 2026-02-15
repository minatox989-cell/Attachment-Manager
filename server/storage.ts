import { users, appointments, reviews, reports, type User, type InsertUser, type Appointment, type InsertAppointment, type Review, type Report, type WorkerFilters, type AdminStats } from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getWorkers(filters?: WorkerFilters): Promise<User[]>;
  getWorker(id: number): Promise<User | undefined>;
  updateWorkerAvailability(id: number, isAvailable: boolean): Promise<User>;
  
  createAppointment(appointment: InsertAppointment & { userId: number }): Promise<Appointment>;
  getAppointments(userId: number, role: "user" | "worker"): Promise<(Appointment & { user?: User; worker?: User })[]>;
  updateAppointmentStatus(id: number, status: string, visitTime?: Date): Promise<Appointment>;
  
  createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review>;
  getWorkerReviews(workerId: number): Promise<Review[]>;
  
  createReport(report: Omit<Report, "id" | "createdAt" | "status">): Promise<Report>;
  getReports(): Promise<(Report & { reporter?: User; reportedWorker?: User })[]>;
  
  getStats(): Promise<AdminStats>;
  seed(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getWorkers(filters?: WorkerFilters): Promise<User[]> {
    let query = db.select().from(users).where(eq(users.role, "worker"));
    
    if (filters?.workerType) {
      query = db.select().from(users).where(and(eq(users.role, "worker"), eq(users.workerType, filters.workerType)));
    }
    
    // Simple client-side filtering for pincode if needed or add strict equality
    // For now returning all workers matching type, can filter more in memory if complex or add like clause
    const workers = await query;
    if (filters?.pincode) {
      return workers.filter(w => w.pincode.includes(filters.pincode!));
    }
    return workers;
  }

  async getWorker(id: number): Promise<User | undefined> {
    const [worker] = await db.select().from(users).where(and(eq(users.id, id), eq(users.role, "worker")));
    return worker;
  }

  async updateWorkerAvailability(id: number, isAvailable: boolean): Promise<User> {
    const [updated] = await db.update(users)
      .set({ isAvailable })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async createAppointment(appointment: InsertAppointment & { userId: number }): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async getAppointments(userId: number, role: "user" | "worker"): Promise<(Appointment & { user?: User; worker?: User })[]> {
    // For simplicity, we'll fetch related users manually for now
    const whereClause = role === "user" ? eq(appointments.userId, userId) : eq(appointments.workerId, userId);
    
    const appts = await db.select().from(appointments).where(whereClause).orderBy(desc(appointments.createdAt));
    
    // Populate user/worker details
    const populated = await Promise.all(appts.map(async (appt) => {
        const worker = await this.getUser(appt.workerId);
        const user = await this.getUser(appt.userId);
        return { ...appt, worker, user };
    }));
    
    return populated;
  }

  async updateAppointmentStatus(id: number, status: string, visitTime?: Date): Promise<Appointment> {
    const [updated] = await db.update(appointments)
      .set({ status, visitTime })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getWorkerReviews(workerId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.workerId, workerId));
  }

  async createReport(report: Omit<Report, "id" | "createdAt" | "status">): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(): Promise<(Report & { reporter?: User; reportedWorker?: User })[]> {
    const reportsList = await db.select().from(reports).orderBy(desc(reports.createdAt));
    
    const populated = await Promise.all(reportsList.map(async (report) => {
        const reporter = await this.getUser(report.reporterId);
        const reportedWorker = await this.getUser(report.reportedWorkerId);
        return { ...report, reporter, reportedWorker };
    }));
    
    return populated;
  }

  async getStats(): Promise<AdminStats> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "user"));
    const [workerCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "worker"));
    const [apptCount] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(eq(appointments.status, "pending"));
    
    return {
      totalUsers: Number(userCount.count),
      totalWorkers: Number(workerCount.count),
      activeAppointments: Number(apptCount.count),
    };
  }

  async seed(): Promise<void> {
    const [count] = await db.select({ count: sql<number>`count(*)` }).from(users);
    if (Number(count.count) > 0) return;

    console.log("Seeding database...");
    const hashedPassword = await hashPassword("password123");
    const adminPassword = await hashPassword("admin");

    // Admin
    await this.createUser({
      username: "admin@crewhub.com",
      password: adminPassword,
      fullName: "Admin User",
      mobile: "9999999999",
      address: "Admin HQ",
      pincode: "000000",
      role: "admin",
    });

    // Users
    const user1 = await this.createUser({
      username: "user@example.com",
      password: hashedPassword,
      fullName: "John Doe",
      mobile: "1234567890",
      address: "123 Maple St",
      pincode: "10001",
      role: "user",
    });

    // Workers
    const worker1 = await this.createUser({
      username: "electrician@example.com",
      password: hashedPassword,
      fullName: "Mike Spark",
      mobile: "9876543210",
      address: "456 Oak Ave",
      pincode: "10001",
      role: "worker",
      workerType: "Electrician",
      visitingCharge: 50,
      isAvailable: true,
    });

    const worker2 = await this.createUser({
      username: "plumber@example.com",
      password: hashedPassword,
      fullName: "Bob Pipes",
      mobile: "5555555555",
      address: "789 Pine Rd",
      pincode: "10002",
      role: "worker",
      workerType: "Plumber",
      visitingCharge: 40,
      isAvailable: true,
    });

    // Appointments
    await this.createAppointment({
      userId: user1.id,
      workerId: worker1.id,
      issueDescription: "Sparking outlet in kitchen",
      address: "123 Maple St",
      status: "pending",
    });

    console.log("Seeding complete!");
  }
}

export const storage = new DatabaseStorage();
