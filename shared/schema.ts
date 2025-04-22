import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  industry: text("industry").notNull(),
  location: text("location").notNull(),
  employees: integer("employees").notNull(),
  revenue: text("revenue").notNull(),
  status: text("status").notNull(),
  lastContact: text("lastContact").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Email schema for sending emails
export const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  template: z.string(),
  content: z.string().min(1, "Content is required"),
  sendToSelected: z.boolean().optional(),
  companyIds: z.array(z.number()).optional(),
});

export type EmailData = z.infer<typeof emailSchema>;
