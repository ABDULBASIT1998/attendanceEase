
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addMultipleStudents, BulkUploadResult } from '@/lib/mock-data';
import { FileUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface BulkUploadStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (result: BulkUploadResult) => void;
}

export function BulkUploadStudentsModal({ isOpen, onClose, onUploadComplete }: BulkUploadStudentsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
        setUploadResult(null); // Reset previous results
      } else {
        toast({ title: "Invalid File Type", description: "Please upload a .csv file.", variant: "destructive" });
        setSelectedFile(null);
        event.target.value = ""; // Reset file input
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
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      if (csvText) {
        try {
          const result = addMultipleStudents(csvText);
          setUploadResult(result);
          onUploadComplete(result); // Notify parent about the completion and result
        } catch (error: any) {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setUploadResult(null); setSelectedFile(null);} }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileUp className="mr-2 h-5 w-5" /> Bulk Upload Students
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple students.
            The CSV must have a header row with columns: <strong>Student Name</strong>, <strong>Class Name</strong>, <strong>Subjects</strong>.
            Subjects should be a comma-separated list of existing subject names (e.g., "Mathematics, Science").
            Roll numbers are auto-generated and should not be included.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="csv-file-upload">CSV File</Label>
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
            <Card className="mt-4 p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg">Upload Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-sm">
                {uploadResult.successCount > 0 && (
                  <p className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" /> {uploadResult.successCount} student(s) uploaded successfully.
                  </p>
                )}
                {uploadResult.errorCount > 0 && (
                  <p className="flex items-center text-red-600 mt-1">
                    <XCircle className="mr-2 h-4 w-4" /> {uploadResult.errorCount} student(s) failed to upload.
                  </p>
                )}
                {uploadResult.errors.length > 0 && (
                  <>
                    <p className="font-medium mt-2 mb-1">Error Details:</p>
                    <ScrollArea className="h-24 border rounded-md p-2 bg-muted/50">
                      <ul className="list-disc list-inside text-xs">
                        {uploadResult.errors.slice(0, 10).map((err, idx) => ( // Show first 10 errors
                          <li key={idx}>{err}</li>
                        ))}
                         {uploadResult.errors.length > 10 && <li>...and {uploadResult.errors.length - 10} more errors (see console).</li>}
                      </ul>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => { onClose(); setUploadResult(null); setSelectedFile(null);}} disabled={isLoading}>
              {uploadResult ? "Close" : "Cancel"}
            </Button>
            {!uploadResult && (
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
