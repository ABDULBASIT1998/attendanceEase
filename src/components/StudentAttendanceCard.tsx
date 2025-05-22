"use client";

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Student, AttendanceStatus } from '@/types';
import { CheckCircle, XCircle, User } from 'lucide-react';

interface StudentAttendanceCardProps {
  student: Student;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  currentStatus?: AttendanceStatus;
}

export function StudentAttendanceCard({ student, onMarkPresent, onMarkAbsent, currentStatus }: StudentAttendanceCardProps) {
  return (
    <Card className="w-full max-w-md shadow-xl transform transition-all duration-300 hover:scale-105">
      <CardHeader className="items-center text-center">
        {student.photoUrl ? (
           <Image 
             src={student.photoUrl} 
             alt={student.name} 
             width={100} 
             height={100} 
             className="rounded-full border-4 border-primary object-cover"
             data-ai-hint="student portrait"
           />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <CardTitle className="text-2xl mt-4">{student.name}</CardTitle>
        <p className="text-muted-foreground">Roll No: {student.rollNumber}</p>
      </CardHeader>
      <CardContent className="text-center">
        {currentStatus && currentStatus !== 'pending' && (
          <p className={`font-semibold text-lg ${currentStatus === 'present' ? 'text-accent-foreground bg-accent' : 'text-destructive-foreground bg-destructive'} p-2 rounded-md`}>
            Marked as: {currentStatus.toUpperCase()}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-around pt-4">
        <Button 
          variant="outline" 
          className="flex-1 mr-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={onMarkAbsent}
          aria-label={`Mark ${student.name} absent`}
        >
          <XCircle className="mr-2 h-5 w-5" /> Absent
        </Button>
        <Button 
          className="flex-1 ml-2 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={onMarkPresent}
          aria-label={`Mark ${student.name} present`}
        >
          <CheckCircle className="mr-2 h-5 w-5" /> Present
        </Button>
      </CardFooter>
    </Card>
  );
}
