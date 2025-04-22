import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ImportExcel } from "@/components/ui/import-excel";
import { EmailDialog } from "@/components/ui/email-dialog";
import { Mail, Moon, Sun } from "lucide-react";
import CompanyForm from "@/components/ui/company-form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    fullMessage: string;
  }>({
    show: false,
    message: "",
    fullMessage: "",
  });
  const { toast } = useToast();

  // Handle import success
  const handleImportSuccess = (message: string, count: number) => {
    setNotification({
      show: true,
      message: "Import Successful!",
      fullMessage: `${message}! ${count} new records added.`,
    });
    
    // Hide notification after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
    
    // Refresh companies data
    queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
  };

  // Handle email button click
  const handleEmailButtonClick = () => {
    setEmailDialogOpen(true);
  };

  // Handle send emails from data table
  const handleSendEmails = (ids: number[]) => {
    setSelectedCompanyIds(ids);
    setEmailDialogOpen(true);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Business Data Manager</span>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleDarkMode}
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
                <span className="text-sm font-medium">Admin User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Panel */}
        <Card className="p-6 mb-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">Data Management</h2>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              {/* Excel Import Button */}
              <ImportExcel onImportSuccess={handleImportSuccess} />
              
              {/* Email Button */}
              <Button 
                variant="default"
                onClick={handleEmailButtonClick}
                className="inline-flex items-center"
              >
                <Mail className="h-5 w-5 mr-2" />
                Send Emails
              </Button>

              {/* Add Company Button */}
              <Button 
                variant="outline"
                onClick={() => setIsAddingCompany(true)}
              >
                Add Company
              </Button>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <DataTable onSendEmails={handleSendEmails} />
      </main>

      {/* Email Dialog */}
      <EmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        selectedCompanyIds={selectedCompanyIds}
      />

      {/* Add Company Dialog */}
      {isAddingCompany && (
        <CompanyForm
          onClose={() => setIsAddingCompany(false)}
          onSuccess={() => {
            setIsAddingCompany(false);
            queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
          }}
        />
      )}

      {/* Import Notification */}
      {notification.show && (
        <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="p-2 rounded-lg bg-green-600 shadow-lg sm:p-3">
              <div className="flex items-center justify-between flex-wrap">
                <div className="w-0 flex-1 flex items-center">
                  <span className="flex p-2 rounded-lg bg-green-800">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <p className="ml-3 font-medium text-white truncate">
                    <span className="md:hidden">
                      {notification.message}
                    </span>
                    <span className="hidden md:inline">
                      {notification.fullMessage}
                    </span>
                  </p>
                </div>
                <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
                  <button
                    type="button"
                    className="-mr-1 flex p-2 rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
