
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Subject, ClassItem } from '@/types';
import { addClass, getAllSubjects, getAllClasses, updateClass } from '@/lib/mock-data';
import { PlusCircle, Users, Book, ArrowLeft, Pencil } from 'lucide-react';
import { EditClassModal } from '@/components/admin/EditClassModal';

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
    if (selectedSubjectIdsForNewClass.length === 0) {
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

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.push('/admin')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <PlusCircle className="mr-2 h-6 w-6 text-primary" /> Add New Class
            </CardTitle>
            <CardDescription>Create a new class and assign subjects to it. Class names must be unique.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitNewClass} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="className" className="text-lg">Class Name</Label>
                <Input
                  id="className"
                  type="text"
                  placeholder="e.g., Class 9C, Senior Year Group A"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  className="text-base py-3"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg flex items-center">
                  <Book className="mr-2 h-5 w-5 text-muted-foreground" /> Assign Subjects
                </Label>
                {allGlobalSubjects.length === 0 ? (
                   <p className="text-sm text-muted-foreground">No subjects available. Please <Button variant="link" onClick={() => router.push('/admin/subjects')} className="p-0 h-auto">add subjects</Button> first.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 border p-4 rounded-md">
                    {allGlobalSubjects.map(subject => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject.id}`}
                          checked={selectedSubjectIdsForNewClass.includes(subject.id)}
                          onCheckedChange={() => handleSubjectToggleForNewClass(subject.id)}
                        />
                        <Label htmlFor={`subject-${subject.id}`} className="font-normal cursor-pointer">
                          {subject.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || allGlobalSubjects.length === 0}>
                {isLoading ? 'Adding Class...' : 'Add Class'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary" /> Existing Classes
            </CardTitle>
            <CardDescription>List of currently available classes.</CardDescription>
          </CardHeader>
          <CardContent>
            {existingClasses.length === 0 ? (
              <p className="text-muted-foreground">No classes found.</p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {existingClasses.map(cls => (
                  <li key={cls.id} className="p-3 border rounded-md bg-card">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">
                            Subjects: {cls.subjectIds.map(id => allGlobalSubjects.find(s=>s.id === id)?.name).filter(Boolean).join(', ') || 'None'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                            Students: {cls.students.length}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEditClass(cls)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </div>
                  </li>
                ))}
              </ul>
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
    </div>
  );
}
