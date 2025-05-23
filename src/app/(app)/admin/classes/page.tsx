
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Subject, ClassItem } from '@/types';
import { addClass, getAllSubjects, getAllClasses, updateClass, deleteClass } from '@/lib/mock-data';
import { PlusCircle, Users, Book, ArrowLeft, Pencil, Trash2, ListChecks } from 'lucide-react';
import { EditClassModal } from '@/components/admin/EditClassModal';
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

export default function ManageClassesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [className, setClassName] = useState('');
  const [allGlobalSubjects, setAllGlobalSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIdsForNewClass, setSelectedSubjectIdsForNewClass] = useState<string[]>([]);
  const [existingClasses, setExistingClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<ClassItem | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchClassesAndSubjects = () => {
    setAllGlobalSubjects(getAllSubjects());
    setExistingClasses(getAllClasses());
  };

  useEffect(() => {
    fetchClassesAndSubjects();
  }, []);

  const handleSubjectToggleForNewClass = (subjectId: string) => {
    setSelectedSubjectIdsForNewClass(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSubmitNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedClassName = className.trim();
    if (!trimmedClassName) {
      toast({ title: "Error", description: "Class name cannot be empty.", variant: "destructive" });
      return;
    }
    if (selectedSubjectIdsForNewClass.length === 0 && allGlobalSubjects.length > 0) {
      toast({ title: "Error", description: "Please select at least one subject for the class.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      addClass(trimmedClassName, selectedSubjectIdsForNewClass);
      toast({ title: "Success", description: `Class "${trimmedClassName}" added successfully.` });
      setClassName('');
      setSelectedSubjectIdsForNewClass([]);
      fetchClassesAndSubjects(); 
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add class. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClass = (classItem: ClassItem) => {
    setClassToEdit(classItem);
    setIsEditModalOpen(true);
  };

  const handleUpdateClass = (classId: string, newName: string, newSubjectIds: string[]) => {
    try {
      updateClass(classId, newName, newSubjectIds);
      toast({ title: "Success", description: "Class updated successfully." });
      fetchClassesAndSubjects();
      setIsEditModalOpen(false);
      setClassToEdit(null);
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update class.", variant: "destructive" });
      return false;
    }
  };

  const openDeleteDialog = (classItem: ClassItem) => {
    setClassToDelete(classItem);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteClass = () => {
    if (!classToDelete) return;
    try {
      deleteClass(classToDelete.id);
      toast({ title: "Success", description: `Class "${classToDelete.name}" and its students deleted successfully.` });
      fetchClassesAndSubjects();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete class.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
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
              <PlusCircle className="mr-2 h-6 w-6 text-primary" /> Add New Class
            </CardTitle>
            <CardDescription>Create a new class and assign subjects. Class names must be unique.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitNewClass} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="className" className="text-md font-medium">Class Name</Label>
                <Input
                  id="className"
                  type="text"
                  placeholder="e.g., Class 9C, Senior Year Group A"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  className="text-base py-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-md font-medium flex items-center">
                  <Book className="mr-2 h-5 w-5 text-muted-foreground" /> Assign Subjects
                </Label>
                {allGlobalSubjects.length === 0 ? (
                   <p className="text-sm text-muted-foreground">No subjects available. Please <Button variant="link" onClick={() => router.push('/admin/subjects')} className="p-0 h-auto">add subjects</Button> first.</p>
                ) : (
                  <ScrollArea className="h-60 border p-4 rounded-md">
                    <div className="space-y-2">
                      {allGlobalSubjects.map(subject => (
                        <div key={subject.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`subject-${subject.id}`}
                            checked={selectedSubjectIdsForNewClass.includes(subject.id)}
                            onCheckedChange={() => handleSubjectToggleForNewClass(subject.id)}
                          />
                          <Label htmlFor={`subject-${subject.id}`} className="font-normal cursor-pointer text-sm">
                            {subject.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
              <Button type="submit" className="w-full text-base py-3" disabled={isLoading || (allGlobalSubjects.length > 0 && selectedSubjectIdsForNewClass.length === 0 && allGlobalSubjects.length > 0) || (allGlobalSubjects.length === 0 && selectedSubjectIdsForNewClass.length > 0)}>
                {isLoading ? 'Adding Class...' : 'Add Class'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ListChecks className="mr-2 h-6 w-6 text-primary" /> Existing Classes
            </CardTitle>
            <CardDescription>List of currently available classes ({existingClasses.length}).</CardDescription>
          </CardHeader>
          <CardContent>
            {existingClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No classes found. Add one to get started!</p>
            ) : (
              <ScrollArea className="max-h-[calc(100vh-20rem)] pr-2">
                <div className="space-y-4">
                  {existingClasses.map(cls => (
                    <Card key={cls.id} className="bg-card/50 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{cls.name}</CardTitle>
                          <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditClass(cls)} className="h-8 px-3">
                                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(cls)} className="h-8 px-3">
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                              </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 pb-3">
                          <p className="text-sm text-muted-foreground mb-1">
                            <Users className="inline mr-1.5 h-4 w-4 align-text-bottom"/> Students: {cls.students.length}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <Book className="inline mr-1.5 h-4 w-4 align-text-bottom"/> Subjects: {cls.subjectIds.map(id => allGlobalSubjects.find(s=>s.id === id)?.name).filter(Boolean).join(', ') || 'None'}
                          </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      {classToEdit && allGlobalSubjects.length > 0 && (
        <EditClassModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setClassToEdit(null);
          }}
          classItem={classToEdit}
          allSubjects={allGlobalSubjects}
          onUpdate={handleUpdateClass}
        />
      )}
      {classToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the class "{classToDelete.name}" and all its {classToDelete.students.length} student(s).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClassToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteClass} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
