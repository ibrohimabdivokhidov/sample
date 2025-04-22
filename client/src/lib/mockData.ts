import { Company, EmailData } from '@shared/schema';

// Initial sample companies
const initialCompanies: Company[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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

// Store companies in localStorage or use the initial data
const loadCompanies = (): Company[] => {
  const storedCompanies = localStorage.getItem('companies');
  if (storedCompanies) {
    return JSON.parse(storedCompanies);
  }
  localStorage.setItem('companies', JSON.stringify(initialCompanies));
  return initialCompanies;
};

// Save companies to localStorage
const saveCompanies = (companies: Company[]): void => {
  localStorage.setItem('companies', JSON.stringify(companies));
};

// Mock data service
export const mockDataService = {
  // Get paginated companies
  getCompanies: async (page: number, pageSize: number): Promise<{ companies: Company[], total: number }> => {
    const companies = loadCompanies();
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      companies: companies.slice(startIndex, endIndex),
      total: companies.length
    };
  },
  
  // Get a company by ID
  getCompany: async (id: number): Promise<Company | undefined> => {
    const companies = loadCompanies();
    return companies.find(company => company.id === id);
  },
  
  // Create a new company
  createCompany: async (company: Omit<Company, 'id'>): Promise<Company> => {
    const companies = loadCompanies();
    const newId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1;
    
    const newCompany = {
      ...company,
      id: newId
    };
    
    companies.push(newCompany);
    saveCompanies(companies);
    
    return newCompany;
  },
  
  // Update a company
  updateCompany: async (id: number, companyData: Partial<Omit<Company, 'id'>>): Promise<Company | undefined> => {
    const companies = loadCompanies();
    const index = companies.findIndex(company => company.id === id);
    
    if (index === -1) return undefined;
    
    const updatedCompany = {
      ...companies[index],
      ...companyData
    };
    
    companies[index] = updatedCompany;
    saveCompanies(companies);
    
    return updatedCompany;
  },
  
  // Delete a company
  deleteCompany: async (id: number): Promise<boolean> => {
    const companies = loadCompanies();
    const filteredCompanies = companies.filter(company => company.id !== id);
    
    if (filteredCompanies.length === companies.length) return false;
    
    saveCompanies(filteredCompanies);
    return true;
  },
  
  // Search companies
  searchCompanies: async (query: string, page: number, pageSize: number): Promise<{ companies: Company[], total: number }> => {
    const companies = loadCompanies();
    const lowercaseQuery = query.toLowerCase();
    
    const filteredCompanies = companies.filter(company => 
      company.name.toLowerCase().includes(lowercaseQuery) ||
      company.contact.toLowerCase().includes(lowercaseQuery) ||
      company.email.toLowerCase().includes(lowercaseQuery) ||
      company.industry.toLowerCase().includes(lowercaseQuery) ||
      company.location.toLowerCase().includes(lowercaseQuery)
    );
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      companies: filteredCompanies.slice(startIndex, endIndex),
      total: filteredCompanies.length
    };
  },
  
  // Import companies from Excel data
  importCompanies: async (companies: Omit<Company, 'id'>[]): Promise<number> => {
    const existingCompanies = loadCompanies();
    let lastId = existingCompanies.length > 0 ? Math.max(...existingCompanies.map(c => c.id)) : 0;
    
    const newCompanies = companies.map(company => ({
      ...company,
      id: ++lastId
    }));
    
    const updatedCompanies = [...existingCompanies, ...newCompanies];
    saveCompanies(updatedCompanies);
    
    return newCompanies.length;
  },
  
  // Mock email sending (just logs to console in this frontend-only version)
  sendEmail: async (emailData: EmailData): Promise<{ success: boolean, message: string }> => {
    console.log('Email would be sent with the following data:', emailData);
    
    // If company IDs are provided, log those too
    if (emailData.companyIds && emailData.companyIds.length > 0) {
      const companies = loadCompanies();
      const selectedCompanies = companies.filter(company => 
        emailData.companyIds?.includes(company.id)
      );
      console.log('Selected companies:', selectedCompanies);
    }
    
    return { 
      success: true, 
      message: 'Email simulation successful! In a real app, this would send actual emails.' 
    };
  }
};