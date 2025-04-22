import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Search } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Company } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CompanyForm from "./company-form";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface DataTableProps {
  onSendEmails: (selectedIds: number[]) => void;
}

export function DataTable({ onSendEmails }: DataTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean, companyId: number | null }>({ isOpen: false, companyId: null });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Calculate number of pages
  const totalPages = Math.ceil(totalCompanies / pageSize);

  // Fetch companies
  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString()
        });
        
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }
        
        const response = await fetch(`/api/companies?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        
        const data = await response.json();
        setCompanies(data.companies);
        setTotalCompanies(data.total);
      } catch (error) {
        console.error("Error fetching companies:", error);
        toast({
          title: "Error",
          description: "Failed to load companies data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCompanies();
  }, [page, pageSize, searchQuery, toast]);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(companies.map(company => company.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle row selection
  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(companyId => companyId !== id));
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.companyId) return;
    
    try {
      await apiRequest('DELETE', `/api/companies/${deleteDialog.companyId}`);
      setDeleteDialog({ isOpen: false, companyId: null });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      
      // Update local state to avoid full reload
      setCompanies(companies.filter(company => company.id !== deleteDialog.companyId));
      setSelectedIds(selectedIds.filter(id => id !== deleteDialog.companyId));
      
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive"
      });
    }
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => handlePageChange(page - 1)} 
          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );
    
    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis1">
            <span className="px-4 py-2">...</span>
          </PaginationItem>
        );
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => handlePageChange(i)}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis2">
            <span className="px-4 py-2">...</span>
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => handlePageChange(page + 1)} 
          className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );
    
    return items;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Table Actions */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            className="mr-3"
            onClick={() => onSendEmails(selectedIds)}
            disabled={selectedIds.length === 0}
          >
            Bulk Actions
          </Button>
          <span className="text-sm text-gray-500">{selectedIds.length} selected</span>
        </div>
        <form onSubmit={handleSearch} className="w-full sm:w-auto flex items-center">
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search companies..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" className="ml-2">Search</Button>
        </form>
      </div>

      {/* Table with fixed columns */}
      <div className="relative overflow-x-auto" ref={tableContainerRef}>
        <Table>
          <TableHeader>
            <TableRow>
              {/* Checkbox column (fixed) */}
              <TableHead className="sticky left-0 z-20 w-[60px] bg-white">
                <Checkbox 
                  checked={selectedIds.length === companies.length && companies.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              
              {/* Regular columns */}
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contact</TableHead>
              
              {/* Actions column (fixed) */}
              <TableHead className="sticky right-0 z-20 w-[100px] bg-white text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id} className="hover:bg-gray-50">
                  {/* Checkbox column (fixed) */}
                  <TableCell className="sticky left-0 z-10 w-[60px] bg-white">
                    <Checkbox 
                      checked={selectedIds.includes(company.id)}
                      onCheckedChange={(checked) => handleSelectRow(company.id, !!checked)}
                      aria-label={`Select ${company.name}`}
                    />
                  </TableCell>
                  
                  {/* Regular columns */}
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.contact}</TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>{company.phone}</TableCell>
                  <TableCell>{company.industry}</TableCell>
                  <TableCell>{company.location}</TableCell>
                  <TableCell>{company.employees}</TableCell>
                  <TableCell>{company.revenue}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${company.status === 'Active' ? 'bg-green-100 text-green-800' : 
                        company.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {company.status}
                    </span>
                  </TableCell>
                  <TableCell>{company.lastContact}</TableCell>
                  
                  {/* Actions column (fixed) */}
                  <TableCell className="sticky right-0 z-10 w-[100px] bg-white text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingCompany(company)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeleteDialog({ isOpen: true, companyId: company.id })}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{companies.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{" "}
              <span className="font-medium">{Math.min(page * pageSize, totalCompanies)}</span> of{" "}
              <span className="font-medium">{totalCompanies}</span> results
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Pagination>
              <PaginationContent>
                {generatePaginationItems()}
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, isOpen: open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Company Dialog */}
      {editingCompany && (
        <CompanyForm 
          company={editingCompany} 
          onClose={() => setEditingCompany(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
            setEditingCompany(null);
          }} 
        />
      )}
    </div>
  );
}
