
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Student, AttendanceRecord, ClassItem, Subject, AttendanceStatus } from '@/types';
import { getClassById, getSubjectById, getStudentsForSubjectInClass, getStudentsByClass as getAllStudentsInClass } from '@/lib/mock-data'; // Updated import
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
  const [studentsForSubject, setStudentsForSubject] = useState<Student[]>([]); // Students enrolled in this subject
  const [allStudentsInClassForLookup, setAllStudentsInClassForLookup] = useState<Student[]>([]); // For name/roll lookup
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
    const subjectData = getSubjectById(subjectId);
    const studentsEnrolled = getStudentsForSubjectInClass(classId, subjectId);
    const allStudentsInCls = getAllStudentsInClass(classId); // For lookup
    
    setAllStudentsInClassForLookup(allStudentsInCls);
    
    const storedRecordsRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    let storedRecords: AttendanceRecord[] = [];
    if (storedRecordsRaw) {
        try {
            storedRecords = JSON.parse(storedRecordsRaw);
        } catch (e) {
            console.error("Failed to parse stored attendance records", e);
            toast({ title: "Warning", description: "Could not load saved attendance, starting fresh.", variant: "default" });
        }
    }


    if (classData && subjectData) {
      setCurrentClass(classData);
      setCurrentSubject(subjectData);
      setStudentsForSubject(studentsEnrolled);

      if (studentsEnrolled.length > 0) {
        // If records are stored, use them, otherwise initialize
        if (storedRecords.length > 0) {
             // Filter storedRecords to only include students currently enrolled in this subject
            const relevantRecords = storedRecords.filter(rec => studentsEnrolled.some(s => s.id === rec.studentId));
            const studentIdsFromRecords = relevantRecords.map(r => r.studentId);
            // Add pending records for any enrolled students not in storedRecords
            const newPendingRecords = studentsEnrolled
                .filter(s => !studentIdsFromRecords.includes(s.id))
                .map(s => ({ studentId: s.id, status: 'pending' as AttendanceStatus }));
            setAttendanceRecords([...relevantRecords, ...newPendingRecords]);
        } else {
            setAttendanceRecords(studentsEnrolled.map(s => ({ studentId: s.id, status: 'pending' })));
        }
      } else {
        setAttendanceRecords([]); // No students, no records
      }
      
    } else {
      toast({ title: "Error", description: "Could not load attendance summary data. Class or Subject might be missing.", variant: "destructive" });
      router.push('/dashboard');
    }
    
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setIsLoading(false);
  }, [classId, subjectId, router, toast]); // localStorageKey is not needed as a dependency here

  const getStudentDetails = useCallback((studentId: string): { name: string; rollNumber: string } => {
    const student = allStudentsInClassForLookup.find(s => s.id === studentId);
    return {
        name: student?.name || 'Unknown Student',
        rollNumber: student?.rollNumber || 'N/A'
    };
  }, [allStudentsInClassForLookup]);

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
          const newStatus: AttendanceStatus = record.status === 'present' ? 'absent' : (record.status === 'absent' ? 'present' : 'present');
          return { ...record, status: newStatus };
        }
        return record;
      });
      if (localStorageKey) { // Ensure key is set before saving
        localStorage.setItem(localStorageKey, JSON.stringify(updatedRecords));
      }
      toast({
        title: "Attendance Updated",
        description: `${getStudentDetails(studentId).name}'s status changed.`,
      });
      return updatedRecords;
    });
  }, [localStorageKey, toast, getStudentDetails]);

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

  if (isLoading) {
     return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!currentClass || !currentSubject) {
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
          <CardDescription>Review the attendance records for students enrolled in this subject. Click on a status to edit. <Edit3 className="inline h-4 w-4 ml-1" /></CardDescription>
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
          {studentsForSubject.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No students are enrolled in this subject for this class.</p>
          ) : attendanceRecords.length === 0 && studentsForSubject.length > 0 ? (
             <p className="text-muted-foreground text-center py-4">Attendance has not been taken yet for these students. Please <Button variant="link" className="p-0 h-auto" onClick={() => router.push(`/attendance/${classId}/${subjectId}`)}>start the attendance session</Button>.</p>
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
                {attendanceRecords.map((record) => {
                    const studentInfo = getStudentDetails(record.studentId);
                    // Only render if studentInfo is valid (student exists in class)
                    // This check is mostly for robustness, as attendanceRecords should only contain valid students for the subject
                    if(studentInfo.name === 'Unknown Student') return null; 

                    return (
                    <TableRow key={record.studentId}>
                        <TableCell>{studentInfo.rollNumber}</TableCell>
                        <TableCell>{studentInfo.name}</TableCell>
                        <TableCell 
                        className="text-center cursor-pointer group"
                        onClick={() => handleStatusToggle(record.studentId)}
                        title={`Click to change status for ${studentInfo.name}`}
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
                    );
                })}
              </TableBody>
            </Table>
          )}
          
          <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
            <Button variant="outline" onClick={() => handleExport('excel')} disabled={studentsForSubject.length === 0}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')} disabled={studentsForSubject.length === 0}>
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
