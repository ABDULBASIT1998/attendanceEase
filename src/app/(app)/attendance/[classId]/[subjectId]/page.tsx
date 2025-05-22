"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StudentAttendanceCard } from '@/components/StudentAttendanceCard';
import type { Student, AttendanceRecord, ClassItem, Subject, AttendanceStatus } from '@/types';
import { getClassById, getSubjectById, getStudentsByClass } from '@/lib/mock-data';
import { ArrowLeft, ArrowRight, CalendarDays, CheckSquare, Library, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const classId = params.classId as string;
  const subjectId = params.subjectId as string;

  const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const classData = getClassById(classId);
    const subjectData = getSubjectById(classId, subjectId);
    const studentData = getStudentsByClass(classId);

    if (classData && subjectData && studentData.length > 0) {
      setCurrentClass(classData);
      setCurrentSubject(subjectData);
      setStudents(studentData);
      setAttendanceRecords(studentData.map(s => ({ studentId: s.id, status: 'pending' })));
    } else {
      // Handle case where class/subject/students are not found
      toast({ title: "Error", description: "Class, subject, or student data not found.", variant: "destructive" });
      router.push('/dashboard');
    }
    
    // Set current date
    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, [classId, subjectId, router, toast]);

  const currentStudent = useMemo(() => students[currentIndex], [students, currentIndex]);

  const handleMarkAttendance = (status: AttendanceStatus) => {
    if (!currentStudent) return;

    setAttendanceRecords(prevRecords =>
      prevRecords.map(record =>
        record.studentId === currentStudent.id ? { ...record, status } : record
      )
    );

    if (currentIndex < students.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last student marked
      toast({ title: "All students marked!", description: "You can now review and finalize." });
    }
  };

  const handleNext = () => {
    if (currentIndex < students.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinalize = () => {
    // Store attendance data in localStorage for the summary page (simple solution for scaffold)
    // A real app would save this to a database.
    localStorage.setItem(`attendance-${classId}-${subjectId}`, JSON.stringify(attendanceRecords));
    router.push(`/attendance/${classId}/${subjectId}/summary`);
  };

  const progress = students.length > 0 ? ((currentIndex + 1) / students.length) * 100 : 0;
  const markedStudentsCount = attendanceRecords.filter(r => r.status !== 'pending').length;

  if (!currentClass || !currentSubject || !currentStudent) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const currentStudentAttendance = attendanceRecords.find(ar => ar.studentId === currentStudent.id);

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl mb-6 p-4 border rounded-lg shadow bg-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-primary" /> Class: <span className="font-semibold text-foreground ml-1">{currentClass.name}</span></div>
            <div className="flex items-center"><Library className="mr-2 h-4 w-4 text-primary" /> Subject: <span className="font-semibold text-foreground ml-1">{currentSubject.name}</span></div>
            <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" /> Date: <span className="font-semibold text-foreground ml-1">{currentDate}</span></div>
        </div>
      </div>

      <StudentAttendanceCard
        student={currentStudent}
        onMarkPresent={() => handleMarkAttendance('present')}
        onMarkAbsent={() => handleMarkAttendance('absent')}
        currentStatus={currentStudentAttendance?.status}
      />

      <div className="w-full max-w-md mt-6">
        <Progress value={progress} className="w-full h-3 mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          Student {currentIndex + 1} of {students.length}
        </p>
      </div>

      <div className="flex justify-between w-full max-w-md mt-6">
        <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={handleNext} disabled={currentIndex === students.length - 1}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {markedStudentsCount === students.length && (
        <Button 
          onClick={handleFinalize} 
          className="mt-8 text-lg py-6 px-8 bg-primary hover:bg-primary/90"
          size="lg"
        >
          <CheckSquare className="mr-2 h-5 w-5" /> Finalize Attendance
        </Button>
      )}
    </div>
  );
}
