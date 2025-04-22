import { companies, users, type User, type InsertUser, type Company, type InsertCompany } from "@shared/schema";
import { db } from "./db";
import { eq, or, ilike, count, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Company methods
  getCompanies(page: number, pageSize: number): Promise<{ companies: Company[], total: number }>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;
  searchCompanies(query: string, page: number, pageSize: number): Promise<{ companies: Company[], total: number }>;
  createManyCompanies(companies: InsertCompany[]): Promise<number>;
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
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCompanies(page: number, pageSize: number): Promise<{ companies: Company[], total: number }> {
    // Get total count
    const [result] = await db.select({ value: count() }).from(companies);
    const total = result?.value || 0;
    
    // Get paginated companies
    const offset = (page - 1) * pageSize;
    const companyList = await db
      .select()
      .from(companies)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(companies.id));
    
    return { companies: companyList, total };
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updatedCompany] = await db
      .update(companies)
      .set(companyData)
      .where(eq(companies.id, id))
      .returning();
    
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await db
      .delete(companies)
      .where(eq(companies.id, id));
    
    return true; // PostgreSQL doesn't return deleted count in a standard way
  }

  async searchCompanies(query: string, page: number, pageSize: number): Promise<{ companies: Company[], total: number }> {
    // Build search condition
    const searchCondition = or(
      ilike(companies.name, `%${query}%`),
      ilike(companies.contact, `%${query}%`),
      ilike(companies.email, `%${query}%`),
      ilike(companies.industry, `%${query}%`),
      ilike(companies.location, `%${query}%`)
    );
    
    // Get total count
    const [result] = await db
      .select({ value: count() })
      .from(companies)
      .where(searchCondition);
    const total = result?.value || 0;
    
    // Get paginated search results
    const offset = (page - 1) * pageSize;
    const companyList = await db
      .select()
      .from(companies)
      .where(searchCondition)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(companies.id));
    
    return { companies: companyList, total };
  }

  async createManyCompanies(insertCompanies: InsertCompany[]): Promise<number> {
    if (insertCompanies.length === 0) return 0;
    
    const result = await db
      .insert(companies)
      .values(insertCompanies)
      .returning();
    
    return result.length;
  }
}

export const storage = new DatabaseStorage();
