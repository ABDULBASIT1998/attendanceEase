"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Student, AttendanceRecord, ClassItem, Subject } from '@/types';
import { getClassById, getSubjectById, getStudentsByClass } from '@/lib/mock-data';
import { FileSpreadsheet, FileText, Users, Library, CalendarDays, Download, Check, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AttendanceSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const classId = params.classId as string;
  const subjectId = params.subjectId as string;

  const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const classData = getClassById(classId);
    const subjectData = getSubjectById(classId, subjectId);
    const studentData = getStudentsByClass(classId);
    
    // Retrieve attendance data from localStorage
    const storedRecords = localStorage.getItem(`attendance-${classId}-${subjectId}`);

    if (classData && subjectData && studentData.length > 0 && storedRecords) {
      setCurrentClass(classData);
      setCurrentSubject(subjectData);
      setStudents(studentData);
      setAttendanceRecords(JSON.parse(storedRecords));
    } else {
      toast({ title: "Error", description: "Could not load attendance summary data.", variant: "destructive" });
      router.push('/dashboard'); // Redirect if data is missing
    }
    
    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setIsLoading(false);
  }, [classId, subjectId, router, toast]);

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown Student';
  };
  
  const getStudentRoll = (studentId: string) => {
    return students.find(s => s.id === studentId)?.rollNumber || 'N/A';
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}`,
      description: `Preparing attendance data for download. This is a placeholder action.`,
    });
    // Placeholder for actual export logic
  };

  if (isLoading) {
     return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!currentClass || !currentSubject || attendanceRecords.length === 0) {
     return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Attendance Data Not Found</h2>
        <p className="text-muted-foreground mb-4">Could not retrieve attendance data for this session.</p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;


  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Attendance Summary</CardTitle>
          <CardDescription>Review the attendance records before exporting.</CardDescription>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground pt-2">
                <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-primary" /> Class: <span className="font-semibold text-foreground ml-1">{currentClass.name}</span></div>
                <div className="flex items-center"><Library className="mr-2 h-4 w-4 text-primary" /> Subject: <span className="font-semibold text-foreground ml-1">{currentSubject.name}</span></div>
                <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" /> Date: <span className="font-semibold text-foreground ml-1">{currentDate}</span></div>
            </div>
             <div className="flex gap-4 pt-2">
                <span className="font-semibold text-accent">Present: {presentCount}</span>
                <span className="font-semibold text-destructive">Absent: {absentCount}</span>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((record) => (
                <TableRow key={record.studentId}>
                  <TableCell>{getStudentRoll(record.studentId)}</TableCell>
                  <TableCell>{getStudentName(record.studentId)}</TableCell>
                  <TableCell className="text-center">
                    {record.status === 'present' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                        <Check className="mr-1 h-4 w-4" /> Present
                      </span>
                    ) : record.status === 'absent' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                        <X className="mr-1 h-4 w-4" /> Absent
                      </span>
                    ) : (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <FileText className="mr-2 h-4 w-4" /> Export to PDF
            </Button>
             <Button onClick={() => router.push('/dashboard')}>
              <Download className="mr-2 h-4 w-4" /> New Attendance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
