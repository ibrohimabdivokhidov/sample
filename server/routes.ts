import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import { insertCompanySchema, emailSchema, type InsertCompany } from "@shared/schema";
import nodemailer from "nodemailer";
import { ZodError } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

// Setup email transport (using ethereal for testing)
const getTestTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Get companies with pagination
  apiRouter.get("/companies", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const searchQuery = req.query.search as string || "";
      
      let result;
      if (searchQuery) {
        result = await storage.searchCompanies(searchQuery, page, pageSize);
      } else {
        result = await storage.getCompanies(page, pageSize);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Get a company by ID
  apiRouter.get("/companies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Create a company
  apiRouter.post("/companies", async (req: Request, res: Response) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // Update a company
  apiRouter.put("/companies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyData = insertCompanySchema.partial().parse(req.body);
      const updatedCompany = await storage.updateCompany(id, companyData);
      
      if (!updatedCompany) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(updatedCompany);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Delete a company
  apiRouter.delete("/companies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCompany(id);
      
      if (!success) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Import Excel file
  apiRouter.post("/import", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      // Validate and transform data
      const companies: InsertCompany[] = [];
      
      for (const item of data) {
        const record = item as Record<string, any>;
        
        try {
          // Transform keys to match our schema
          const company: InsertCompany = {
            name: String(record.name || record.Name || record.company || record.Company || ""),
            contact: String(record.contact || record.Contact || record.contactPerson || record.ContactPerson || ""),
            email: String(record.email || record.Email || ""),
            phone: String(record.phone || record.Phone || record.phoneNumber || record.PhoneNumber || ""),
            industry: String(record.industry || record.Industry || ""),
            location: String(record.location || record.Location || record.address || record.Address || ""),
            employees: Number(record.employees || record.Employees || record.employeeCount || record.EmployeeCount || 0),
            revenue: String(record.revenue || record.Revenue || ""),
            status: String(record.status || record.Status || "Active"),
            lastContact: String(record.lastContact || record.LastContact || record.last_contact || new Date().toISOString().split('T')[0]),
          };
          
          // Validate with schema
          insertCompanySchema.parse(company);
          companies.push(company);
        } catch (validationError) {
          console.error("Validation error for record:", record, validationError);
          // Continue processing other records
        }
      }
      
      // Save validated companies
      const count = await storage.createManyCompanies(companies);
      
      res.status(201).json({ 
        message: "Excel file imported successfully", 
        recordsAdded: count 
      });
    } catch (error) {
      console.error("Error importing Excel file:", error);
      res.status(500).json({ message: "Failed to import Excel file" });
    }
  });

  // Send emails
  apiRouter.post("/send-email", async (req: Request, res: Response) => {
    try {
      const emailData = emailSchema.parse(req.body);
      
      // Get companies to send emails to
      let companiesForEmail = [];
      
      if (emailData.sendToSelected && emailData.companyIds && emailData.companyIds.length > 0) {
        // Send to selected companies
        for (const id of emailData.companyIds) {
          const company = await storage.getCompany(id);
          if (company) {
            companiesForEmail.push(company);
          }
        }
      } else {
        // Send to all companies (first 100 for this example)
        const result = await storage.getCompanies(1, 100);
        companiesForEmail = result.companies;
      }
      
      if (companiesForEmail.length === 0) {
        return res.status(400).json({ message: "No companies to send emails to" });
      }
      
      // Create transporter for testing
      const transporter = await getTestTransporter();
      
      // Send emails (in a real app, this would be done in batches)
      const emailPromises = companiesForEmail.map(async (company) => {
        // Replace placeholders in the content
        let content = emailData.content
          .replace(/\${company}/g, company.name)
          .replace(/\${contact}/g, company.contact)
          .replace(/\${email}/g, company.email);
        
        const info = await transporter.sendMail({
          from: '"Business Data Manager" <no-reply@businessdata.com>',
          to: company.email,
          subject: emailData.subject,
          html: content,
        });
        
        return {
          company: company.name,
          messageId: info.messageId,
          previewUrl: nodemailer.getTestMessageUrl(info)
        };
      });
      
      const results = await Promise.all(emailPromises);
      
      res.json({ 
        message: `Emails sent to ${results.length} companies`,
        details: results
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid email data", errors: error.errors });
      }
      console.error("Error sending emails:", error);
      res.status(500).json({ message: "Failed to send emails" });
    }
  });

  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
