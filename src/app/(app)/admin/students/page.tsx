
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { ClassItem, Student, Subject } from '@/types';
import { addStudent, getAllClasses, getStudentsByClass, getSubjectsForClass, getAllSubjects as getAllGlobalSubjects } from '@/lib/mock-data';
import { UserPlus, Users, ArrowLeft, ListChecks, BookOpen } from 'lucide-react';
import Image from 'next/image';

export default function ManageStudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [availableClassSubjects, setAvailableClassSubjects] = useState<Subject[]>([]);
  const [selectedStudentSubjectIds, setSelectedStudentSubjectIds] = useState<string[]>([]);
  
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [studentsInSelectedClass, setStudentsInSelectedClass] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allGlobalSubjects, setAllGlobalSubjects] = useState<Subject[]>([]);


  useEffect(() => {
    setAllClasses(getAllClasses());
    setAllGlobalSubjects(getAllGlobalSubjects());
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      setStudentsInSelectedClass(getStudentsByClass(selectedClassId));
      const subjectsForClass = getSubjectsForClass(selectedClassId);
      setAvailableClassSubjects(subjectsForClass);
      setSelectedStudentSubjectIds([]); // Reset student subjects when class changes
    } else {
      setStudentsInSelectedClass([]);
      setAvailableClassSubjects([]);
      setSelectedStudentSubjectIds([]);
    }
  }, [selectedClassId]);

  const handleStudentSubjectToggle = (subjectId: string) => {
    setSelectedStudentSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !rollNumber.trim()) {
      toast({ title: "Error", description: "Student name and roll number are required.", variant: "destructive" });
      return;
    }
    if (!selectedClassId) {
      toast({ title: "Error", description: "Please select a class for the student.", variant: "destructive" });
      return;
    }
    if (selectedStudentSubjectIds.length === 0) {
        toast({ title: "Error", description: "Please select at least one subject for the student.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      addStudent(selectedClassId, { 
        name: studentName, 
        rollNumber, 
        photoUrl: photoUrl || undefined,
        studentSubjectIds: selectedStudentSubjectIds 
      });
      toast({ title: "Success", description: `Student "${studentName}" added to class.` });
      setStudentName('');
      setRollNumber('');
      setPhotoUrl('');
      setSelectedStudentSubjectIds([]);
      if (selectedClassId) {
        setStudentsInSelectedClass(getStudentsByClass(selectedClassId));
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add student.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSubjectNameById = (subjectId: string) => {
    return allGlobalSubjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';
  }

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
            <CardDescription>Enter student details, assign to a class, and select their subjects.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="rollNumber" className="text-lg">Roll Number</Label>
                <Input
                  id="rollNumber"
                  type="text"
                  placeholder="e.g., 10A001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  className="text-base py-3"
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="photoUrl" className="text-lg">Photo URL (Optional)</Label>
                <Input
                  id="photoUrl"
                  type="url"
                  placeholder="https://placehold.co/100x100.png"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="text-base py-3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-select" className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Assign to Class
                </Label>
                {allClasses.length === 0 ? (
                     <p className="text-sm text-muted-foreground">No classes available. Please <Button variant="link" onClick={() => router.push('/admin/classes')} className="p-0 h-auto">add classes</Button> first.</p>
                ) : (
                <Select
                  onValueChange={(value) => setSelectedClassId(value)}
                  value={selectedClassId || ""}
                  required
                >
                  <SelectTrigger id="class-select" className="w-full text-base py-6">
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

              {selectedClassId && availableClassSubjects.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-lg flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-muted-foreground" /> Assign Subjects to Student
                  </Label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border p-4 rounded-md">
                    {availableClassSubjects.map(subject => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`student-subject-${subject.id}`}
                          checked={selectedStudentSubjectIds.includes(subject.id)}
                          onCheckedChange={() => handleStudentSubjectToggle(subject.id)}
                        />
                        <Label htmlFor={`student-subject-${subject.id}`} className="font-normal cursor-pointer">
                          {subject.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedClassId && availableClassSubjects.length === 0 && (
                 <p className="text-sm text-muted-foreground">The selected class has no subjects assigned. Please <Button variant="link" onClick={() => router.push('/admin/classes')} className="p-0 h-auto">assign subjects to the class</Button> first.</p>
              )}


              <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || allClasses.length === 0 || (selectedClassId && availableClassSubjects.length === 0)}>
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
              {selectedClassId ? `Students in ${allClasses.find(c=>c.id === selectedClassId)?.name || 'Selected Class'}` : 'Select a class to view students.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedClassId ? (
              <p className="text-muted-foreground">Please select a class from the "Add New Student" form to see the list of students.</p>
            ) : studentsInSelectedClass.length === 0 ? (
              <p className="text-muted-foreground">No students found in this class.</p>
            ) : (
              <ul className="space-y-3 max-h-[calc(100vh-25rem)] overflow-y-auto">
                {studentsInSelectedClass.map(student => (
                  <li key={student.id} className="p-3 border rounded-md bg-card">
                    <div className="flex items-center space-x-3">
                        <Image
                        src={student.photoUrl || `https://placehold.co/40x40.png`}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                        data-ai-hint="student avatar"
                        />
                        <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-xs text-muted-foreground">Roll No: {student.rollNumber}</p>
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
    </div>
  );
}
