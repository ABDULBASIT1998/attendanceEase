
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Student, AttendanceRecord, ClassItem, Subject, AttendanceStatus } from '@/types';
import { getClassById, getSubjectById, getStudentsForSubjectInClass, getStudentsByClass as getAllStudentsInClass } from '@/lib/mock-data';
import { FileSpreadsheet, FileText, Users, Library, CalendarDays, Download, Check, X, AlertTriangle, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Inline SVG for WhatsApp icon
const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="mr-2 h-4 w-4"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);


export default function AttendanceSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const classId = params.classId as string;
  const subjectId = params.subjectId as string;

  const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [studentsForSubject, setStudentsForSubject] = useState<Student[]>([]);
  const [allStudentsInClassForLookup, setAllStudentsInClassForLookup] = useState<Student[]>([]);
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
    const allStudentsInCls = getAllStudentsInClass(classId); 
    
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
        if (storedRecords.length > 0) {
            const relevantRecords = storedRecords.filter(rec => studentsEnrolled.some(s => s.id === rec.studentId));
            const studentIdsFromRecords = relevantRecords.map(r => r.studentId);
            const newPendingRecords = studentsEnrolled
                .filter(s => !studentIdsFromRecords.includes(s.id))
                .map(s => ({ studentId: s.id, status: 'pending' as AttendanceStatus }));
            setAttendanceRecords([...relevantRecords, ...newPendingRecords]);
        } else {
            setAttendanceRecords(studentsEnrolled.map(s => ({ studentId: s.id, status: 'pending' })));
        }
      } else {
        setAttendanceRecords([]);
      }
      
    } else {
      toast({ title: "Error", description: "Could not load attendance summary data. Class or Subject might be missing.", variant: "destructive" });
      router.push('/dashboard');
    }
    
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setIsLoading(false);
  }, [classId, subjectId, router, toast]);

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

  const handleShareToWhatsApp = () => {
    if (!currentClass || !currentSubject || attendanceRecords.length === 0) {
        toast({ title: "Cannot Share", description: "No attendance data available to share.", variant: "destructive"});
        return;
    }

    let summaryText = `*Attendance Summary*\n\n`;
    summaryText += `*Class:* ${currentClass.name}\n`;
    summaryText += `*Subject:* ${currentSubject.name}\n`;
    summaryText += `*Date:* ${currentDate}\n\n`;
    summaryText += `*Present:* ${presentCount}\n`;
    summaryText += `*Absent:* ${absentCount}\n\n`;
    summaryText += `*Student Details:*\n`;

    attendanceRecords.forEach(record => {
        const studentInfo = getStudentDetails(record.studentId);
        if (studentInfo.name !== 'Unknown Student') {
            summaryText += `- *${studentInfo.name}* (\`${studentInfo.rollNumber}\`): *${record.status.toUpperCase()}*\n`;
        }
    });

    const encodedText = encodeURIComponent(summaryText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');

    toast({
      title: "Sharing to WhatsApp",
      description: "Sharing text summary. PDF generation is a future enhancement.",
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
      if (localStorageKey) {
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
          
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => handleExport('excel')} disabled={studentsForSubject.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export to Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('pdf')} disabled={studentsForSubject.length === 0}>
                    <FileText className="mr-2 h-4 w-4" /> Export to PDF
                </Button>
                <Button variant="outline" onClick={handleShareToWhatsApp} disabled={studentsForSubject.length === 0 || presentCount + absentCount === 0}>
                    <WhatsAppIcon /> Share to WhatsApp
                </Button>
            </div>
            <Button onClick={() => router.push('/dashboard')} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> New Attendance Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

