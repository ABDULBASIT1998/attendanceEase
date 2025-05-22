"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { ClassItem, Subject } from '@/types';
import { mockClasses } from '@/lib/mock-data';
import { ArrowRight, BookOpen, BookUser } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (selectedClass) {
      setAvailableSubjects(selectedClass.subjects);
      setSelectedSubject(null); // Reset subject when class changes
    } else {
      setAvailableSubjects([]);
    }
  }, [selectedClass]);

  const handleStartAttendance = () => {
    if (selectedClass && selectedSubject) {
      router.push(`/attendance/${selectedClass.id}/${selectedSubject.id}`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <BookOpen className="mr-2 h-6 w-6 text-primary" />
            Take Attendance
          </CardTitle>
          <CardDescription>Select a class and subject to begin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="class-select" className="flex items-center text-lg">
              <BookUser className="mr-2 h-5 w-5 text-muted-foreground" />
              Select Class
            </Label>
            <Select
              onValueChange={(value) => {
                const classItem = mockClasses.find(c => c.id === value);
                setSelectedClass(classItem || null);
              }}
            >
              <SelectTrigger id="class-select" className="w-full text-base py-6">
                <SelectValue placeholder="Choose a class..." />
              </SelectTrigger>
              <SelectContent>
                {mockClasses.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id} className="text-base py-2">
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <div className="space-y-2">
              <Label htmlFor="subject-select" className="flex items-center text-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                Select Subject
              </Label>
              <Select
                onValueChange={(value) => {
                  const subjectItem = availableSubjects.find(s => s.id === value);
                  setSelectedSubject(subjectItem || null);
                }}
                value={selectedSubject?.id || ""}
                disabled={availableSubjects.length === 0}
              >
                <SelectTrigger id="subject-select" className="w-full text-base py-6">
                  <SelectValue placeholder="Choose a subject..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id} className="text-base py-2">
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleStartAttendance}
            disabled={!selectedClass || !selectedSubject}
            className="w-full text-lg py-6 mt-4"
          >
            Start Attendance <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
