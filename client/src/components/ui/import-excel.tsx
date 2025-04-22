import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

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
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Upload file
    await uploadFile(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import file");
      }

      const result = await response.json();
      
      // Call onImportSuccess callback
      onImportSuccess(result.message, result.recordsAdded);
      
      toast({
        title: "Import Successful",
        description: `Imported ${result.recordsAdded} records from ${file.name}`,
      });
    } catch (error) {
      console.error("Error importing file:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import file",
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
        {isUploading ? "Uploading..." : "Import Excel"}
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
