import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes"; // Ensure this import path is correct and api is exported
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

// Use a simple global for now, or scrypt
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePassword(stored: string, supplied: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Seed DB if empty
  await storage.seed();

  const SessionStore = MemoryStore(session);
  app.use(
    session({
      store: new SessionStore({ checkPeriod: 86400000 }),
      secret: "crewhub_secret_key", // In prod use env var
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // Set to true if https
    })
  );

  // Middleware to protect routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      req.session.userId = user.id;
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = req.body;
    
    // Admin Hardcode Check as per requirements (also handled by seed but good for explicit check)
    if (username === "admin@crewhub.com" && password === "admin") {
        let admin = await storage.getUserByUsername("admin@crewhub.com");
        if (admin) {
            req.session.userId = admin.id;
            return res.json(admin);
        }
    }

    const user = await storage.getUserByUsername(username);
    if (!user || !(await comparePassword(user.password, password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    req.session.userId = user.id;
    res.json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) return res.sendStatus(401);
    const user = await storage.getUser(req.session.userId);
    res.json(user);
  });

  // Worker Routes
  app.get(api.workers.list.path, async (req, res) => {
    const workers = await storage.getWorkers(req.query);
    res.json(workers);
  });

  app.get(api.workers.get.path, async (req, res) => {
    const worker = await storage.getWorker(Number(req.params.id));
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    
    // Calculate average rating
    const reviews = await storage.getWorkerReviews(worker.id);
    const avg = reviews.length > 0 
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
        : 0;
        
    res.json({ ...worker, averageRating: avg });
  });

  app.patch(api.workers.toggleAvailability.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'worker') return res.sendStatus(403);
    
    const updated = await storage.updateWorkerAvailability(user.id, req.body.isAvailable);
    res.json(updated);
  });

  // Appointment Routes
  app.post(api.appointments.create.path, requireAuth, async (req, res) => {
    const appointment = await storage.createAppointment({
      ...req.body,
      userId: req.session.userId,
    });
    res.status(201).json(appointment);
  });

  app.get(api.appointments.list.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.sendStatus(401);
    
    const appointments = await storage.getAppointments(user.id, user.role as "user" | "worker");
    res.json(appointments);
  });

  app.patch(api.appointments.updateStatus.path, requireAuth, async (req, res) => {
    // Verify ownership? For now assume worker is valid
    const updated = await storage.updateAppointmentStatus(
        Number(req.params.id), 
        req.body.status, 
        req.body.visitTime ? new Date(req.body.visitTime) : undefined
    );
    res.json(updated);
  });

  // Reviews
  app.post(api.reviews.create.path, requireAuth, async (req, res) => {
    const review = await storage.createReview({
      ...req.body,
      userId: req.session.userId
    });
    res.status(201).json(review);
  });

  // Reports
  app.post(api.reports.create.path, requireAuth, async (req, res) => {
    const report = await storage.createReport({
      ...req.body,
      reporterId: req.session.userId
    });
    res.status(201).json(report);
  });

  app.get(api.reports.list.path, requireAuth, async (req, res) => {
    // Check admin
    const user = await storage.getUser(req.session.userId);
    if (user?.role !== 'admin') return res.sendStatus(403);
    
    const reports = await storage.getReports();
    res.json(reports);
  });

  app.get(api.admin.stats.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId);
    if (user?.role !== 'admin') return res.sendStatus(403);
    
    const stats = await storage.getStats();
    res.json(stats);
  });

  return httpServer;
}
