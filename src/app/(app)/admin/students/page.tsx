
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { ClassItem, Student, Subject } from '@/types';
import { addStudent, getAllClasses, getStudentsByClass, getSubjectsForClass, getAllSubjects as getAllGlobalSubjects, updateStudent, deleteStudent, BulkUploadResult } from '@/lib/mock-data';
import { UserPlus, Users, ArrowLeft, ListChecks, BookOpen, Upload, Image as ImageIcon, Pencil, Trash2, FileUp } from 'lucide-react';
import Image from 'next/image';
import { EditStudentModal } from '@/components/admin/EditStudentModal';
import { BulkUploadStudentsModal } from '@/components/admin/BulkUploadStudentsModal';
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
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);


  const fetchAllData = () => {
    setAllClasses(getAllClasses());
    setAllGlobalSubjects(getAllGlobalSubjects());
    // If a class is selected, refresh its student list
    if (selectedClassIdForNewStudent) {
      setStudentsInSelectedClass(getStudentsByClass(selectedClassIdForNewStudent));
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedClassIdForNewStudent) {
      setStudentsInSelectedClass(getStudentsByClass(selectedClassIdForNewStudent));
      const subjectsForClass = getSubjectsForClass(selectedClassIdForNewStudent);
      setAvailableClassSubjectsForNewStudent(subjectsForClass);
      setSelectedStudentSubjectIdsForNewStudent([]); // Reset subject selection for new student
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
    // This check is important: if there are subjects available for the class, at least one must be selected for the student.
    // If the class has NO subjects assigned to it, then it's fine to add a student without subjects.
    if (selectedStudentSubjectIdsForNewStudent.length === 0 && availableClassSubjectsForNewStudent.length > 0) {
        toast({ title: "Error", description: "Please select at least one subject for the student from the class's available subjects.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      // In a real app, you'd upload selectedPhotoFile here and get a URL.
      // For mock, we use photoPreviewUrl if it's set (from file selection), otherwise default placeholder.
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
      if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      setSelectedStudentSubjectIdsForNewStudent([]);
      // Re-fetch students for the currently selected class to show the new student
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
    classId: string, // Keep classId for context, though not directly editable in this modal
    updatedData: Partial<Omit<Student, 'id' | 'classId' | 'rollNumber'>> & { studentSubjectIds?: string[], photoFile?: File | null, photoUrl?: string | null }
  ) => {
    try {
        let photoUrlToUpdate = studentToEdit?.photoUrl; // Start with current photo

        if (updatedData.photoFile) { // A new file was selected
             // In a real app, upload file here and get URL. For mock:
             // We'll rely on the component to generate a blob URL for preview,
             // and mock-data will store this blob URL for the session.
             // For this mock, let's assume updatedData.photoUrl (if set by modal after file read) is the one to use.
             // Or, if photoFile is present, we can assume a blob URL was created and passed as photoUrl in updatedData.
             // The EditStudentModal needs to handle creating this blob URL for preview and passing it.
             // For simplicity, the mock-data's updateStudent will just take photoUrl.
             // The modal passes `photoPreviewUrl` as `photoUrl` in `updatePayload`.
             photoUrlToUpdate = updatedData.photoUrl; 
        } else if (updatedData.photoUrl === null) { // Photo was explicitly removed
            photoUrlToUpdate = `https://placehold.co/100x100.png`;
        } else if (updatedData.photoUrl && updatedData.photoUrl !== studentToEdit?.photoUrl) { // URL changed without a file (e.g., user pasted a URL - not implemented here, but for robustness)
            photoUrlToUpdate = updatedData.photoUrl;
        }

        // Construct the data object for the update function
        const dataForUpdate = { ...updatedData, photoUrl: photoUrlToUpdate };
        delete dataForUpdate.photoFile; // Remove the File object before sending to mock-data

        updateStudent(studentId, classId, dataForUpdate);
        toast({ title: "Success", description: "Student updated successfully." });
        // Refresh the student list for the currently selected class in the UI, if any
        if (selectedClassIdForNewStudent) { 
            setStudentsInSelectedClass(getStudentsByClass(selectedClassIdForNewStudent));
        } else if (classForStudentToEdit) { // If editing was done from a non-selected class context
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
      // Refresh list for the currently selected class
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

  const handleBulkUploadComplete = (result: BulkUploadResult) => {
    if (result.successCount > 0) {
        toast({
            title: "Bulk Upload Successful",
            description: `${result.successCount} student(s) uploaded.`,
        });
    }
    if (result.errorCount > 0) {
        toast({
            title: "Bulk Upload Errors",
            description: `${result.errorCount} student(s) could not be uploaded. ${result.errors.length > 0 ? 'First error: ' + result.errors[0] : ''}`,
            variant: "destructive",
            duration: 10000, // Show longer for errors
        });
        // Log all errors to console for debugging
        console.error("Bulk upload errors:", result.errors);
    }
    fetchAllData(); // Refresh all data including classes (in case new students make a class appear in selections)
    // If a class is selected on the page, refresh its student list specifically
    if (selectedClassIdForNewStudent) {
        setStudentsInSelectedClass(getStudentsByClass(selectedClassIdForNewStudent));
    }
    setIsBulkUploadModalOpen(false);
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.push('/admin')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Add Student and Bulk Upload */}
        <div className="lg:col-span-1 space-y-8">
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
                        <Label htmlFor="studentName" className="text-md font-medium">Student Name</Label>
                        <Input
                        id="studentName"
                        type="text"
                        placeholder="e.g., Priya Sharma"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        required
                        className="text-base py-2"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="photo" className="text-md font-medium">Student Photo</Label>
                        <div className="flex items-center space-x-4">
                        {photoPreviewUrl ? (
                            <Image src={photoPreviewUrl} alt="Student preview" width={64} height={64} className="rounded-md object-cover border" data-ai-hint="student photo preview" />
                        ) : (
                            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center border" data-ai-hint="student avatar placeholder">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
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
                        <p className="text-xs text-muted-foreground mt-1">Optional. Simulated upload for preview.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="class-select-new-student" className="text-md font-medium flex items-center">
                        <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Assign to Class
                        </Label>
                        {allClasses.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No classes available. Please <Button variant="link" onClick={() => router.push('/admin/classes')} className="p-0 h-auto">add classes</Button> first.</p>
                        ) : (
                        <Select
                        onValueChange={(value) => setSelectedClassIdForNewStudent(value)}
                        value={selectedClassIdForNewStudent || ""}
                        >
                        <SelectTrigger id="class-select-new-student" className="w-full text-base py-3">
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
                        <Label className="text-md font-medium flex items-center">
                            <BookOpen className="mr-2 h-5 w-5 text-muted-foreground" /> Assign Subjects to Student
                        </Label>
                        <ScrollArea className="h-40 border p-3 rounded-md">
                          <div className="space-y-2">
                            {availableClassSubjectsForNewStudent.map(subject => (
                            <div key={subject.id} className="flex items-center space-x-3">
                                <Checkbox
                                id={`student-subject-new-${subject.id}`}
                                checked={selectedStudentSubjectIdsForNewStudent.includes(subject.id)}
                                onCheckedChange={() => handleStudentSubjectToggleForNewStudent(subject.id)}
                                />
                                <Label htmlFor={`student-subject-new-${subject.id}`} className="font-normal cursor-pointer text-sm">
                                {subject.name}
                                </Label>
                            </div>
                            ))}
                          </div>
                        </ScrollArea>
                        </div>
                    )}
                    {/* Message if class is selected but has no subjects */}
                    {selectedClassIdForNewStudent && availableClassSubjectsForNewStudent.length === 0 && allGlobalSubjects.length > 0 && (
                        <p className="text-sm text-muted-foreground">The selected class has no subjects assigned. Please <Button variant="link" onClick={() => router.push('/admin/classes')} className="p-0 h-auto">assign subjects to the class</Button> first. Students can only be assigned subjects that are part of their class.</p>
                    )}

                    <Button 
                        type="submit" 
                        className="w-full text-base py-3" 
                        disabled={
                            isLoading || 
                            allClasses.length === 0 || 
                            !selectedClassIdForNewStudent || 
                            (availableClassSubjectsForNewStudent.length > 0 && selectedStudentSubjectIdsForNewStudent.length === 0)
                            // Allow adding student if class has NO subjects (they'll just have no subjects)
                        }
                    >
                        {isLoading ? 'Adding Student...' : 'Add Student'}
                    </Button>
                    </form>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center">
                        <FileUp className="mr-2 h-6 w-6 text-primary" /> Bulk Upload Students
                    </CardTitle>
                    <CardDescription>Upload multiple students at once using a CSV file.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setIsBulkUploadModalOpen(true)} className="w-full text-base py-3">
                        Open Bulk Upload
                    </Button>
                </CardContent>
            </Card>
        </div>


        {/* Column 2: Students in Class List */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ListChecks className="mr-2 h-6 w-6 text-primary" /> Students in Class
            </CardTitle>
            <CardDescription>
              {selectedClassIdForNewStudent ? `Students in ${allClasses.find(c=>c.id === selectedClassIdForNewStudent)?.name || 'Selected Class'} (${studentsInSelectedClass.length})` : 'Select a class from "Add New Student" to view students.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedClassIdForNewStudent ? (
              <p className="text-muted-foreground text-center py-4">Please select a class to see the list of students.</p>
            ) : studentsInSelectedClass.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No students found in this class.</p>
            ) : (
              <ScrollArea className="max-h-[calc(100vh-20rem)] pr-2">
                <div className="space-y-4">
                  {studentsInSelectedClass.map(student => (
                    <Card key={student.id} className="bg-card/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-start space-x-4">
                        <Image
                          src={student.photoUrl || `https://placehold.co/64x64.png`}
                          alt={student.name}
                          width={64}
                          height={64}
                          className="rounded-md object-cover border"
                          data-ai-hint="student avatar indian" // Added specific hint
                        />
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">Roll No: {student.rollNumber}</p>
                          <div className="mt-1">
                              <p className="text-xs font-medium text-muted-foreground">Enrolled Subjects:</p>
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
                        </div>
                        <div className="flex flex-col space-y-2 items-end shrink-0">
                            <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)} className="h-8 px-3 w-full">
                                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(student)} className="h-8 px-3 w-full">
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                            </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {isBulkUploadModalOpen && (
        <BulkUploadStudentsModal
            isOpen={isBulkUploadModalOpen}
            onClose={() => setIsBulkUploadModalOpen(false)}
            onUploadComplete={handleBulkUploadComplete}
            allClasses={allClasses} // Pass allClasses for validation within modal if needed, or rely on mock-data
            allGlobalSubjects={allGlobalSubjects} // Pass subjects for validation
        />
      )}

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
          allGlobalSubjects={allGlobalSubjects} // Used for looking up subject names for display
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
