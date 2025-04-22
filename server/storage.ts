import { companies, users, type User, type InsertUser, type Company, type InsertCompany } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companiesMap: Map<number, Company>;
  currentUserId: number;
  currentCompanyId: number;

  constructor() {
    this.users = new Map();
    this.companiesMap = new Map();
    this.currentUserId = 1;
    this.currentCompanyId = 1;
    
    // Add some initial sample companies
    const sampleCompanies: InsertCompany[] = [
      {
        name: "Acme Inc.",
        contact: "John Smith",
        email: "john@acmeinc.com",
        phone: "+1 (555) 123-4567",
        industry: "Technology",
        location: "San Francisco, CA",
        employees: 250,
        revenue: "$25M",
        status: "Active",
        lastContact: "2023-08-15",
      },
      {
        name: "TechCorp",
        contact: "Jane Doe",
        email: "jane@techcorp.com",
        phone: "+1 (555) 987-6543",
        industry: "Software",
        location: "Austin, TX",
        employees: 500,
        revenue: "$50M",
        status: "Pending",
        lastContact: "2023-08-10",
      },
      {
        name: "Global Industries",
        contact: "Michael Johnson",
        email: "michael@globalind.com",
        phone: "+1 (555) 222-3333",
        industry: "Manufacturing",
        location: "Chicago, IL",
        employees: 1200,
        revenue: "$120M",
        status: "Inactive",
        lastContact: "2023-07-22",
      }
    ];
    
    sampleCompanies.forEach(company => this.createCompany(company));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCompanies(page: number, pageSize: number): Promise<{ companies: Company[], total: number }> {
    const companies = Array.from(this.companiesMap.values());
    const total = companies.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      companies: companies.slice(startIndex, endIndex),
      total
    };
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companiesMap.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.currentCompanyId++;
    const company: Company = { ...insertCompany, id };
    this.companiesMap.set(id, company);
    return company;
  }

  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companiesMap.get(id);
    if (!company) return undefined;
    
    const updatedCompany = { ...company, ...companyData };
    this.companiesMap.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    return this.companiesMap.delete(id);
  }

  async searchCompanies(query: string, page: number, pageSize: number): Promise<{ companies: Company[], total: number }> {
    const companies = Array.from(this.companiesMap.values());
    const lowercaseQuery = query.toLowerCase();
    
    const filteredCompanies = companies.filter(company => 
      company.name.toLowerCase().includes(lowercaseQuery) ||
      company.contact.toLowerCase().includes(lowercaseQuery) ||
      company.email.toLowerCase().includes(lowercaseQuery) ||
      company.industry.toLowerCase().includes(lowercaseQuery) ||
      company.location.toLowerCase().includes(lowercaseQuery)
    );
    
    const total = filteredCompanies.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      companies: filteredCompanies.slice(startIndex, endIndex),
      total
    };
  }

  async createManyCompanies(insertCompanies: InsertCompany[]): Promise<number> {
    let count = 0;
    for (const company of insertCompanies) {
      await this.createCompany(company);
      count++;
    }
    return count;
  }
}

export const storage = new MemStorage();
