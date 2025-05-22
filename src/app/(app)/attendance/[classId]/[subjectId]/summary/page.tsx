
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Student, AttendanceRecord, ClassItem, Subject, AttendanceStatus } from '@/types';
import { getClassById, getSubjectById, getStudentsByClass } from '@/lib/mock-data';
import { FileSpreadsheet, FileText, Users, Library, CalendarDays, Download, Check, X, AlertTriangle, Edit3 } from 'lucide-react';
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
  const [localStorageKey, setLocalStorageKey] = useState('');


  useEffect(() => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const key = `attendance-${classId}-${subjectId}-${dateString}`;
    setLocalStorageKey(key);

    const classData = getClassById(classId);
    const subjectData = getSubjectById(subjectId); // Fetch global subject
    const studentData = getStudentsByClass(classId);
    
    const storedRecords = typeof window !== 'undefined' ? localStorage.getItem(key) : null;

    if (classData && subjectData && studentData.length > 0 && storedRecords) {
      setCurrentClass(classData);
      setCurrentSubject(subjectData);
      setStudents(studentData);
      setAttendanceRecords(JSON.parse(storedRecords));
    } else if (classData && subjectData && studentData.length > 0 && !storedRecords) {
       // This case might happen if the user navigates here directly without marking attendance
      setCurrentClass(classData);
      setCurrentSubject(subjectData);
      setStudents(studentData);
      // Initialize with pending if no records found, or decide how to handle
      setAttendanceRecords(studentData.map(s => ({ studentId: s.id, status: 'pending' })));
      toast({ title: "Info", description: "No prior attendance found for today. Displaying students list.", variant: "default" });
    }
     else {
      toast({ title: "Error", description: "Could not load attendance summary data. Class or Subject might be missing.", variant: "destructive" });
      router.push('/dashboard');
    }
    
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setIsLoading(false);
  }, [classId, subjectId, router, toast]);

  const getStudentName = useCallback((studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown Student';
  }, [students]);
  
  const getStudentRoll = useCallback((studentId: string) => {
    return students.find(s => s.id === studentId)?.rollNumber || 'N/A';
  }, [students]);

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}`,
      description: `Preparing attendance data for download. This is a placeholder action.`,
    });
  };

  const handleStatusToggle = useCallback((studentId: string) => {
    setAttendanceRecords(prevRecords => {
      const updatedRecords = prevRecords.map(record => {
        if (record.studentId === studentId) {
          const newStatus: AttendanceStatus = record.status === 'present' ? 'absent' : (record.status === 'absent' ? 'present' : 'present'); // Default to present if pending
          return { ...record, status: newStatus };
        }
        return record;
      });
      if (localStorageKey) {
        localStorage.setItem(localStorageKey, JSON.stringify(updatedRecords));
      }
      toast({
        title: "Attendance Updated",
        description: `${getStudentName(studentId)}'s status changed.`,
      });
      return updatedRecords;
    });
  }, [localStorageKey, toast, getStudentName]);

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

  if (isLoading) {
     return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!currentClass || !currentSubject) { // Removed attendanceRecords.length === 0 check to allow showing empty summary
     return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Data Not Found</h2>
        <p className="text-muted-foreground mb-4">Could not retrieve class or subject information.</p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Attendance Summary</CardTitle>
          <CardDescription>Review the attendance records. Click on a status to edit. <Edit3 className="inline h-4 w-4 ml-1" /></CardDescription>
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
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No students found in this class.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Status (Click to Edit)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.studentId}>
                    <TableCell>{getStudentRoll(record.studentId)}</TableCell>
                    <TableCell>{getStudentName(record.studentId)}</TableCell>
                    <TableCell 
                      className="text-center cursor-pointer group"
                      onClick={() => handleStatusToggle(record.studentId)}
                      title={`Click to change status for ${getStudentName(record.studentId)}`}
                    >
                      {record.status === 'present' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground group-hover:bg-accent/80 transition-colors">
                          <Check className="mr-1 h-4 w-4" /> Present
                        </span>
                      ) : record.status === 'absent' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground group-hover:bg-destructive/80 transition-colors">
                          <X className="mr-1 h-4 w-4" /> Absent
                        </span>
                      ) : (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground group-hover:bg-muted/80 transition-colors">
                          Pending
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <FileText className="mr-2 h-4 w-4" /> Export to PDF
            </Button>
             <Button onClick={() => router.push('/dashboard')}>
              <Download className="mr-2 h-4 w-4" /> New Attendance Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
