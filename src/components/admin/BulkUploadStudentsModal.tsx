
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addMultipleStudents, BulkUploadResult } from '@/lib/mock-data';
import type { ClassItem, Subject } from '@/types';
import { FileUp, CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle as ModalCardTitle } from "@/components/ui/card"; // Renamed to avoid conflict

interface BulkUploadStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (result: BulkUploadResult) => void;
  allClasses: ClassItem[]; // Passed for context or validation if needed, though mock-data handles most validation
  allGlobalSubjects: Subject[]; // Passed for context or validation
}

export function BulkUploadStudentsModal({ 
    isOpen, 
    onClose, 
    onUploadComplete,
    allClasses,
    allGlobalSubjects 
}: BulkUploadStudentsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
        setUploadResult(null); // Reset previous results when a new file is selected
      } else {
        toast({ title: "Invalid File Type", description: "Please upload a .csv file.", variant: "destructive" });
        setSelectedFile(null);
        if (event.target) event.target.value = ""; // Reset file input
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({ title: "No File Selected", description: "Please select a CSV file to upload.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setUploadResult(null); // Clear previous results before new upload

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      if (csvText) {
        try {
          // The addMultipleStudents function in mock-data will perform all validations
          const result = addMultipleStudents(csvText);
          setUploadResult(result);
          onUploadComplete(result); // Notify parent about the completion and result
          // Don't close modal immediately, let user see the summary
        } catch (error: any) { // Catch errors from addMultipleStudents if it throws directly
          toast({ title: "Upload Failed", description: error.message || "An unexpected error occurred during processing.", variant: "destructive" });
          setUploadResult({ successCount: 0, errorCount: 0, errors: [error.message || "Processing error"] });
        }
      } else {
        toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
        setUploadResult({ successCount: 0, errorCount: 0, errors: ["File read error"] });
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
        toast({ title: "File Read Error", description: "Failed to read the file.", variant: "destructive" });
        setIsLoading(false);
        setUploadResult({ successCount: 0, errorCount: 0, errors: ["Failed to read file"] });
    };
    reader.readAsText(selectedFile);
  };

  const handleCloseModal = () => {
    onClose();
    // Reset state when modal is closed by button or overlay click
    setSelectedFile(null);
    setUploadResult(null);
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FileUp className="mr-2 h-5 w-5" /> Bulk Upload Students
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: <strong>Student Name</strong>, <strong>Class Name</strong>, <strong>Subjects</strong>.
            <br />- Headers are required.
            <br />- Class Name must match an existing class.
            <br />- Subjects must be comma-separated, existing global subjects, AND assigned to the specified class.
            <br />- Roll numbers are auto-generated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="csv-file-upload" className="text-sm font-medium">CSV File</Label>
            <Input
              id="csv-file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          
          {uploadResult && (
            <Card className="mt-4 p-3 shadow-sm">
              <CardHeader className="p-0 pb-2">
                <ModalCardTitle className="text-md">Upload Summary</ModalCardTitle>
              </CardHeader>
              <CardContent className="p-0 text-xs">
                {uploadResult.successCount > 0 && (
                  <p className="flex items-center text-green-600">
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> {uploadResult.successCount} student(s) uploaded successfully.
                  </p>
                )}
                {uploadResult.errorCount > 0 && (
                  <p className="flex items-center text-red-600 mt-0.5">
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> {uploadResult.errorCount} student(s) failed to upload.
                  </p>
                )}
                {uploadResult.errors.length > 0 && (
                  <>
                    <p className="font-medium mt-1.5 mb-0.5">Error Details (first 10):</p>
                    <ScrollArea className="h-20 border rounded-md p-1.5 bg-muted/30">
                      <ul className="list-disc list-inside text-xs">
                        {uploadResult.errors.slice(0, 10).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                         {uploadResult.errors.length > 10 && <li>...and {uploadResult.errors.length - 10} more errors (check console).</li>}
                      </ul>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isLoading}>
              {uploadResult ? "Close" : "Cancel"}
            </Button>
            {!uploadResult && ( // Only show upload button if no result yet, or allow re-upload? For now, hide.
              <Button type="submit" disabled={isLoading || !selectedFile}>
                {isLoading ? "Processing..." : "Upload and Process"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
