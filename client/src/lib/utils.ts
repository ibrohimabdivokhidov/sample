import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date string
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  } catch (error) {
    return dateStr;
  }
}

// Check if a file is Excel format
export function isExcelFile(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['xlsx', 'xls', 'csv'].includes(extension || '');
}

// Parse Excel headers to match our schema
export function normalizeHeaders(headers: string[]): string[] {
  const headerMap: Record<string, string> = {
    'company': 'name',
    'company name': 'name',
    'contact person': 'contact',
    'contact name': 'contact',
    'phone number': 'phone',
    'employee count': 'employees',
    'number of employees': 'employees',
    'last contacted': 'lastContact',
    'last contact date': 'lastContact',
  };
  
  return headers.map(header => {
    const lowerHeader = header.toLowerCase();
    return headerMap[lowerHeader] || lowerHeader;
  });
}
