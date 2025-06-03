
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Subject } from '@/types';
import { addSubject, getAllSubjects, updateSubject, deleteSubject } from '@/lib/mock-data';
import { PlusCircle, BookOpen, ArrowLeft, ListChecks, Pencil, Trash2 } from 'lucide-react';
import { EditSubjectModal } from '@/components/admin/EditSubjectModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';


export default function ManageSubjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [subjectName, setSubjectName] = useState('');
  const [existingSubjects, setExistingSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchSubjects = () => {
    setExistingSubjects(getAllSubjects());
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSubjectName = subjectName.trim();
    if (!trimmedSubjectName) {
      toast({ title: "Error", description: "Subject name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      addSubject(trimmedSubjectName);
      toast({ title: "Success", description: `Subject "${trimmedSubjectName}" added successfully.` });
      setSubjectName('');
      fetchSubjects(); 
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add subject. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setSubjectToEdit(subject);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubject = (subjectId: string, newName: string) => {
    try {
      updateSubject(subjectId, newName);
      toast({ title: "Success", description: "Subject updated successfully." });
      fetchSubjects();
      setIsEditModalOpen(false);
      setSubjectToEdit(null);
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update subject.", variant: "destructive" });
      return false;
    }
  };

  const openDeleteDialog = (subject: Subject) => {
    setSubjectToDelete(subject);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteSubject = () => {
    if (!subjectToDelete) return;
    try {
      deleteSubject(subjectToDelete.id);
      toast({ title: "Success", description: `Subject "${subjectToDelete.name}" deleted successfully.` });
      fetchSubjects();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete subject.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setSubjectToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.push('/admin')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <PlusCircle className="mr-2 h-6 w-6 text-primary" /> Add New Subject
            </CardTitle>
            <CardDescription>Add a new subject to the global list. Subject names must be unique.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subjectName" className="text-md font-medium">Subject Name</Label>
                <Input
                  id="subjectName"
                  type="text"
                  placeholder="e.g., Advanced Physics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  required
                  className="text-base py-2"
                />
              </div>
              <Button type="submit" className="w-full text-base py-3" disabled={isLoading}>
                {isLoading ? 'Adding Subject...' : 'Add Subject'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ListChecks className="mr-2 h-6 w-6 text-primary" /> Existing Subjects
            </CardTitle>
            <CardDescription>List of all available subjects ({existingSubjects.length}).</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {existingSubjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No subjects found. Add one above!</p>
            ) : (
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {existingSubjects.map(subject => (
                    <div key={subject.id} className="p-4 border rounded-lg bg-card/50 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center">
                        <BookOpen className="mr-3 h-5 w-5 text-primary" />
                        <span className="font-medium">{subject.name}</span>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditSubject(subject)} className="h-8 px-3">
                          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(subject)} className="h-8 px-3">
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      {subjectToEdit && (
        <EditSubjectModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSubjectToEdit(null);
          }}
          subject={subjectToEdit}
          onUpdate={handleUpdateSubject}
        />
      )}
      {subjectToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the subject "{subjectToDelete.name}" and remove it from all classes and students.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSubjectToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSubject} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

