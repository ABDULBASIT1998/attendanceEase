
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { ClassItem, Student, Subject } from '@/types';
import { addStudent, getAllClasses, getStudentsByClass, getSubjectsForClass, getAllSubjects as getAllGlobalSubjects, updateStudent, deleteStudent } from '@/lib/mock-data';
import { UserPlus, Users, ArrowLeft, ListChecks, BookOpen, Upload, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { EditStudentModal } from '@/components/admin/EditStudentModal';
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

export default function ManageStudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [studentName, setStudentName] = useState('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedClassIdForNewStudent, setSelectedClassIdForNewStudent] = useState<string | null>(null);
  const [availableClassSubjectsForNewStudent, setAvailableClassSubjectsForNewStudent] = useState<Subject[]>([]);
  const [selectedStudentSubjectIdsForNewStudent, setSelectedStudentSubjectIdsForNewStudent] = useState<string[]>([]);
  
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [studentsInSelectedClass, setStudentsInSelectedClass] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allGlobalSubjects, setAllGlobalSubjects] = useState<Subject[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [classForStudentToEdit, setClassForStudentToEdit] = useState<ClassItem | null>(null);

  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  const fetchAllData = () => {
    setAllClasses(getAllClasses());
    setAllGlobalSubjects(getAllGlobalSubjects());
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedClassIdForNewStudent) {
      setStudentsInSelectedClass(getStudentsByClass(selectedClassIdForNewStudent));
      const subjectsForClass = getSubjectsForClass(selectedClassIdForNewStudent);
      setAvailableClassSubjectsForNewStudent(subjectsForClass);
      setSelectedStudentSubjectIdsForNewStudent([]); 
    } else {
      setStudentsInSelectedClass([]);
      setAvailableClassSubjectsForNewStudent([]);
      setSelectedStudentSubjectIdsForNewStudent([]);
    }
  }, [selectedClassIdForNewStudent]);

  const handleStudentSubjectToggleForNewStudent = (subjectId: string) => {
    setSelectedStudentSubjectIdsForNewStudent(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedPhotoFile(null);
      setPhotoPreviewUrl(null);
    }
  };

  const handleSubmitNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast({ title: "Error", description: "Student name is required.", variant: "destructive" });
      return;
    }
    if (!selectedClassIdForNewStudent) {
      toast({ title: "Error", description: "Please select a class for the student.", variant: "destructive" });
      return;
    }
    if (selectedStudentSubjectIdsForNewStudent.length === 0 && availableClassSubjectsForNewStudent.length > 0) {
        toast({ title: "Error", description: "Please select at least one subject for the student.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      // For simulation, if a file is selected, we use its blob URL (photoPreviewUrl)
      // Otherwise, we use the default placeholder. In a real app, this would be an upload process.
      const photoUrlForStorage = photoPreviewUrl || `https://placehold.co/100x100.png`;
      
      addStudent(selectedClassIdForNewStudent, { 
        name: studentName, 
        photoUrl: photoUrlForStorage, 
        studentSubjectIds: selectedStudentSubjectIdsForNewStudent 
      });
      toast({ title: "Success", description: `Student "${studentName}" added to class.` });
      setStudentName('');
      setSelectedPhotoFile(null);
      setPhotoPreviewUrl(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      setSelectedStudentSubjectIdsForNewStudent([]);
      if (selectedClassIdForNewStudent) {
        setStudentsInSelectedClass(getStudentsByClass(selectedClassIdForNewStudent));
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add student.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSubjectNameById = (subjectId: string) => {
    return allGlobalSubjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';
  }

  const handleEditStudent = (student: Student) => {
    const studentClass = allClasses.find(c => c.id === student.classId);
    if (studentClass) {
        setStudentToEdit(student);
        setClassForStudentToEdit(studentClass);
        setIsEditModalOpen(true);
    } else {
        toast({ title: "Error", description: "Could not find class for this student.", variant: "destructive"});
    }
  };

  const handleUpdateStudent = (
    studentId: string, 
    classId: string,
    updatedData: Partial<Omit<Student, 'id' | 'classId' | 'rollNumber'>> & { studentSubjectIds?: string[], photoFile?: File | null, photoUrl?: string | null }
  ) => {
    try {
        let photoUrlToUpdate = studentToEdit?.photoUrl; 

        if (updatedData.photoFile) { 
             photoUrlToUpdate = URL.createObjectURL(updatedData.photoFile); 
        } else if (updatedData.photoUrl === null) { 
            photoUrlToUpdate = `https://placehold.co/100x100.png`;
        } else if (updatedData.photoUrl && updatedData.photoUrl !== studentToEdit?.photoUrl) { 
            photoUrlToUpdate = updatedData.photoUrl;
        }


        const dataForUpdate = { ...updatedData, photoUrl: photoUrlToUpdate };
        delete dataForUpdate.photoFile; 

        updateStudent(studentId, classId, dataForUpdate);
        toast({ title: "Success", description: "Student updated successfully." });
        if (selectedClassIdForNewStudent) { 
            setStudentsInSelectedClass(getStudentsByClass(selectedClassIdForNewStudent));
        } else if (classForStudentToEdit) { // If updating from student list without a class selected in form
             setStudentsInSelectedClass(getStudentsByClass(classForStudentToEdit.id));
        }
        setIsEditModalOpen(false);
        setStudentToEdit(null);
        setClassForStudentToEdit(null);
        return true;
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to update student.", variant: "destructive" });
        return false;
    }
  };

  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    try {
      deleteStudent(studentToDelete.classId, studentToDelete.id);
      toast({ title: "Success", description: `Student "${studentToDelete.name}" deleted.` });
      if (selectedClassIdForNewStudent) {
        setStudentsInSelectedClass(getStudentsByClass(selectedClassIdForNewStudent));
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete student.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
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
              <UserPlus className="mr-2 h-6 w-6 text-primary" /> Add New Student
            </CardTitle>
            <CardDescription>Enter student details, assign to a class, and select their subjects. Roll number is auto-generated.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitNewStudent} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="studentName" className="text-lg">Student Name</Label>
                <Input
                  id="studentName"
                  type="text"
                  placeholder="e.g., John Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  className="text-base py-3"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo" className="text-lg">Student Photo</Label>
                <div className="flex items-center space-x-4">
                  {photoPreviewUrl ? (
                    <Image src={photoPreviewUrl} alt="Student preview" width={80} height={80} className="rounded-md object-cover border" data-ai-hint="student photo preview" />
                  ) : (
                    <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center border">
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> {selectedPhotoFile ? "Change Photo" : "Upload Photo"}
                  </Button>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    className="hidden" 
                  />
                </div>
                 <p className="text-xs text-muted-foreground mt-1">Simulated upload. Image is for preview only.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-select-new-student" className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Assign to Class
                </Label>
                {allClasses.length === 0 ? (
                     <p className="text-sm text-muted-foreground">No classes available. Please <Button variant="link" onClick={() => router.push('/admin/classes')} className="p-0 h-auto">add classes</Button> first.</p>
                ) : (
                <Select
                  onValueChange={(value) => setSelectedClassIdForNewStudent(value)}
                  value={selectedClassIdForNewStudent || ""}
                  
                >
                  <SelectTrigger id="class-select-new-student" className="w-full text-base py-6">
                    <SelectValue placeholder="Choose a class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allClasses.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id} className="text-base py-2">
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                )}
              </div>

              {selectedClassIdForNewStudent && availableClassSubjectsForNewStudent.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-lg flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-muted-foreground" /> Assign Subjects to Student
                  </Label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border p-4 rounded-md">
                    {availableClassSubjectsForNewStudent.map(subject => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`student-subject-new-${subject.id}`}
                          checked={selectedStudentSubjectIdsForNewStudent.includes(subject.id)}
                          onCheckedChange={() => handleStudentSubjectToggleForNewStudent(subject.id)}
                        />
                        <Label htmlFor={`student-subject-new-${subject.id}`} className="font-normal cursor-pointer">
                          {subject.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedClassIdForNewStudent && availableClassSubjectsForNewStudent.length === 0 && (
                 <p className="text-sm text-muted-foreground">The selected class has no subjects assigned. Please <Button variant="link" onClick={() => router.push('/admin/classes')} className="p-0 h-auto">assign subjects to the class</Button> first.</p>
              )}

              <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || allClasses.length === 0 || (selectedClassIdForNewStudent && availableClassSubjectsForNewStudent.length === 0 && allGlobalSubjects.length > 0) || !selectedClassIdForNewStudent}>
                {isLoading ? 'Adding Student...' : 'Add Student'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ListChecks className="mr-2 h-6 w-6 text-primary" /> Students in Selected Class
            </CardTitle>
            <CardDescription>
              {selectedClassIdForNewStudent ? `Students in ${allClasses.find(c=>c.id === selectedClassIdForNewStudent)?.name || 'Selected Class'}` : 'Select a class to view students.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedClassIdForNewStudent ? (
              <p className="text-muted-foreground">Please select a class from the "Add New Student" form to see the list of students.</p>
            ) : studentsInSelectedClass.length === 0 ? (
              <p className="text-muted-foreground">No students found in this class.</p>
            ) : (
              <ul className="space-y-3 max-h-[calc(100vh-25rem)] overflow-y-auto">
                {studentsInSelectedClass.map(student => (
                  <li key={student.id} className="p-3 border rounded-md bg-card">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Image
                            src={student.photoUrl || `https://placehold.co/40x40.png`}
                            alt={student.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover border"
                            data-ai-hint="student avatar"
                            />
                            <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-xs text-muted-foreground">Roll No: {student.rollNumber}</p>
                            </div>
                        </div>
                        <div className="space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(student)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xs font-medium">Enrolled Subjects:</p>
                        {student.subjectIds && student.subjectIds.length > 0 ? (
                            <ul className="list-disc list-inside pl-1">
                            {student.subjectIds.map(subId => (
                                <li key={subId} className="text-xs text-muted-foreground">{getSubjectNameById(subId)}</li>
                            ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No subjects assigned.</p>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      {isEditModalOpen && studentToEdit && classForStudentToEdit && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setStudentToEdit(null);
            setClassForStudentToEdit(null);
          }}
          student={studentToEdit}
          classItem={classForStudentToEdit}
          allGlobalSubjects={allGlobalSubjects}
          onUpdate={handleUpdateStudent}
        />
      )}
       {studentToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the student "{studentToDelete.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteStudent} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
