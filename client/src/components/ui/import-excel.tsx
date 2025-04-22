import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import * as XLSX from "xlsx";
import { apiRequest } from "@/lib/queryClient";
import { InsertCompany } from "@shared/schema";
import { formatFileSize, normalizeHeaders } from "@/lib/utils";

interface ImportExcelProps {
  onImportSuccess: (message: string, count: number) => void;
}

export function ImportExcel({ onImportSuccess }: ImportExcelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Validate file type
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel or CSV file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please upload a file smaller than 5MB. Current size: ${formatFileSize(file.size)}`,
        variant: "destructive"
      });
      return;
    }

    // Process file
    await processExcelFile(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processExcelFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Show reading progress
      setUploadProgress(20);
      
      // Read the file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse workbook
      setUploadProgress(40);
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Convert to JSON
      setUploadProgress(60);
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });
      
      if (data.length < 2) {
        throw new Error("File contains no data or missing headers");
      }
      
      // First row is headers
      const headers = data[0] as string[];
      // Normalize headers (convert to camelCase, remove spaces, etc.)
      const normalizedHeaders = normalizeHeaders(headers);
      
      // Remaining rows are data
      const rows = data.slice(1);
      
      // Process rows to match company schema
      setUploadProgress(80);
      const companies: Partial<InsertCompany>[] = [];
      
      for (const row of rows) {
        if (!Array.isArray(row) || row.length === 0) continue;
        
        const company: Partial<InsertCompany> = {};
        
        // Map cells to company properties based on headers
        normalizedHeaders.forEach((header, index) => {
          const value = row[index];
          if (value === undefined) return;
          
          switch (header.toLowerCase()) {
            case 'name':
              company.name = String(value);
              break;
            case 'contact':
            case 'contactname':
            case 'contactperson':
              company.contact = String(value);
              break;
            case 'email':
            case 'emailaddress':
              company.email = String(value);
              break;
            case 'phone':
            case 'phonenumber':
              company.phone = String(value);
              break;
            case 'industry':
            case 'sector':
              company.industry = String(value);
              break;
            case 'location':
            case 'address':
              company.location = String(value);
              break;
            case 'employees':
            case 'employeecount':
            case 'employeenumber':
              company.employees = typeof value === 'number' ? value : parseInt(String(value)) || 0;
              break;
            case 'revenue':
            case 'annualrevenue':
              company.revenue = String(value);
              break;
            case 'status':
            case 'companystatus':
              company.status = String(value);
              break;
            case 'lastcontact':
            case 'lastcontactdate':
              company.lastContact = String(value);
              break;
            default:
              // Ignore unknown headers
              break;
          }
        });
        
        // Validate required fields
        if (company.name && company.contact && company.email) {
          // Fill in defaults for missing fields
          if (!company.phone) company.phone = "N/A";
          if (!company.industry) company.industry = "Other";
          if (!company.location) company.location = "Unknown";
          if (!company.employees) company.employees = 0;
          if (!company.revenue) company.revenue = "Unknown";
          if (!company.status) company.status = "New";
          if (!company.lastContact) company.lastContact = new Date().toISOString().split('T')[0];
          
          companies.push(company as InsertCompany);
        }
      }
      
      if (companies.length === 0) {
        throw new Error("No valid company data found in file");
      }
      
      // Submit data to API
      setUploadProgress(90);
      const result = await apiRequest(
        "POST", 
        "/api/import", 
        companies
      );
      
      const responseData = await result.json();
      setUploadProgress(100);
      
      // Call onImportSuccess callback
      onImportSuccess("Import successful", companies.length);
      
      toast({
        title: "Import Successful",
        description: `Imported ${companies.length} companies from ${file.name}`,
      });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive"
      });
    } finally {
      // Reset progress and loading state after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        className="sr-only"
        id="excel-file-input"
        disabled={isUploading}
      />
      <label
        htmlFor="excel-file-input"
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm 
        ${isUploading 
          ? 'bg-gray-400 cursor-not-allowed text-white' 
          : 'bg-primary text-white hover:bg-blue-600 cursor-pointer'} 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        <UploadIcon className="h-5 w-5 mr-2" />
        {isUploading ? "Processing..." : "Import Excel"}
      </label>
      
      {isUploading && (
        <div className="mt-2">
          <Progress value={uploadProgress} className="h-2 w-full" />
          <p className="text-xs text-gray-500 mt-1">{uploadProgress}% complete</p>
        </div>
      )}
    </div>
  );
}
