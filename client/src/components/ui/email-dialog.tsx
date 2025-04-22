import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { emailSchema, type EmailData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCompanyIds: number[];
}

export function EmailDialog({ open, onOpenChange, selectedCompanyIds }: EmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [template, setTemplate] = useState("template1");
  const [emailContent, setEmailContent] = useState(
    "Hello ${contact},\n\nI hope this email finds you well. I wanted to reach out to discuss our services that might benefit ${company}.\n\nPlease let me know if you would like to schedule a call to discuss this further.\n\nBest regards,\nBusiness Data Manager"
  );
  const [sendToSelected, setSendToSelected] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Template options
  const templates = {
    template1: "Hello ${contact},\n\nI hope this email finds you well. I wanted to reach out to discuss our services that might benefit ${company}.\n\nPlease let me know if you would like to schedule a call to discuss this further.\n\nBest regards,\nBusiness Data Manager",
    template2: "Dear ${contact},\n\nI am writing to introduce our company to ${company}. We provide industry-leading solutions that can help you improve efficiency and reduce costs.\n\nI would appreciate the opportunity to discuss how we might work together.\n\nKind regards,\nBusiness Data Manager",
    template3: "Hi ${contact},\n\nWe're excited to share our latest promotion with ${company}! For a limited time, we're offering a special discount on our premium services.\n\nCheck out the details and let us know if you're interested.\n\nRegards,\nBusiness Data Manager",
  };

  // Handle template change
  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    if (value !== "custom" && value in templates) {
      setEmailContent(templates[value as keyof typeof templates]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSending(true);
      
      // Create email data object
      const emailData: EmailData = {
        subject,
        template,
        content: emailContent,
        sendToSelected,
        companyIds: sendToSelected ? selectedCompanyIds : undefined
      };
      
      // Validate data
      emailSchema.parse(emailData);
      
      // Send request
      const response = await apiRequest("POST", "/api/send-email", emailData);
      const result = await response.json();
      
      toast({
        title: "Success",
        description: result.message,
      });
      
      // Close the dialog and reset form
      onOpenChange(false);
      resetForm();
      
    } catch (error) {
      console.error("Error sending emails:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send emails",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSubject("");
    setTemplate("template1");
    setEmailContent(templates.template1);
    setSendToSelected(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Emails
          </DialogTitle>
          <DialogDescription>
            Compose an email to send to companies
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailSubject">Subject</Label>
            <Input
              id="emailSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email Subject"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emailTemplate">Email Template</Label>
            <Select 
              value={template} 
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template1">Follow-up Template</SelectItem>
                <SelectItem value="template2">Introduction Template</SelectItem>
                <SelectItem value="template3">Promotional Template</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emailContent">Email Content</Label>
            <Textarea
              id="emailContent"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[150px]"
              required
            />
            <p className="text-xs text-gray-500">
              Use ${"{company}"}, ${"{contact}"}, and ${"{email}"} as placeholders that will be replaced with actual data.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sendToSelected" 
              checked={sendToSelected}
              onCheckedChange={(checked) => setSendToSelected(!!checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="sendToSelected" className="text-sm font-medium">
                Send only to selected companies
              </Label>
              <p className="text-xs text-gray-500">
                {sendToSelected 
                  ? `Will send to ${selectedCompanyIds.length} selected companies` 
                  : "Will send to all companies in the system"}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSending || (sendToSelected && selectedCompanyIds.length === 0)}
            >
              {isSending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
