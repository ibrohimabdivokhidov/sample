import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { mockDataService } from "./mockData";
import { Company, EmailData } from "@shared/schema";

// Mock API paths - these match the backend API paths for compatibility
const API_PATHS = {
  COMPANIES: "/api/companies",
  IMPORT: "/api/import",
  SEND_EMAIL: "/api/send-email",
};

// Mock response class to simulate fetch responses
class MockResponse {
  public data: any;
  public status: number;
  public statusText: string;
  public ok: boolean;

  constructor(data: any, status = 200, statusText = "OK") {
    this.data = data;
    this.status = status;
    this.statusText = statusText;
    this.ok = status >= 200 && status < 300;
  }

  async text() {
    return typeof this.data === 'string' 
      ? this.data 
      : JSON.stringify(this.data);
  }

  async json() {
    return this.data;
  }
}

async function throwIfResNotOk(res: Response | MockResponse) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<MockResponse> {
  // Mock delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    let result;
    
    // Handle companies endpoints
    if (url.startsWith(API_PATHS.COMPANIES)) {
      // Check if it's a specific company by ID
      const idMatch = url.match(/\/api\/companies\/(\d+)/);
      
      if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        
        if (method === "GET") {
          result = await mockDataService.getCompany(id);
          if (!result) {
            return new MockResponse({ error: "Company not found" }, 404, "Not Found");
          }
        } else if (method === "PUT") {
          result = await mockDataService.updateCompany(id, data as Partial<Company>);
          if (!result) {
            return new MockResponse({ error: "Company not found" }, 404, "Not Found");
          }
        } else if (method === "DELETE") {
          const success = await mockDataService.deleteCompany(id);
          result = { success };
        }
      } else {
        // Handle collection endpoints
        if (method === "GET") {
          // Extract page and search query from URL if present
          const urlObj = new URL(url, window.location.origin);
          const page = parseInt(urlObj.searchParams.get("page") || "1", 10);
          const pageSize = parseInt(urlObj.searchParams.get("pageSize") || "10", 10);
          const search = urlObj.searchParams.get("search") || "";
          
          if (search) {
            result = await mockDataService.searchCompanies(search, page, pageSize);
          } else {
            result = await mockDataService.getCompanies(page, pageSize);
          }
        } else if (method === "POST") {
          result = await mockDataService.createCompany(data as Omit<Company, 'id'>);
        }
      }
    }
    
    // Handle import endpoint
    else if (url === API_PATHS.IMPORT && method === "POST") {
      const count = await mockDataService.importCompanies(data as Omit<Company, 'id'>[]);
      result = { success: true, count };
    }
    
    // Handle email endpoint
    else if (url === API_PATHS.SEND_EMAIL && method === "POST") {
      result = await mockDataService.sendEmail(data as EmailData);
    }
    
    // If we have a result, return success
    if (result !== undefined) {
      return new MockResponse(result);
    }
    
    // If no handler matches, return an error
    return new MockResponse(
      { error: `Unhandled mock endpoint: ${method} ${url}` },
      404,
      "Not Found"
    );
  } catch (error) {
    console.error("Mock API error:", error);
    return new MockResponse(
      { error: String(error) },
      500,
      "Internal Server Error"
    );
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Simulate a fetch request using our mock API
    const res = await apiRequest("GET", queryKey[0] as string);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
