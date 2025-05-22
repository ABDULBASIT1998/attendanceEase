
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { ClassItem, Subject } from '@/types';
import { getAllClasses, getSubjectsForClass, getClassById } from '@/lib/mock-data';
import { ArrowRight, BookOpen, BookUser, FileTextIcon } from 'lucide-react'; // Added FileTextIcon

export default function DashboardPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    setClasses(getAllClasses());
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      setAvailableSubjects(getSubjectsForClass(selectedClassId));
      setSelectedSubjectId(null); // Reset subject when class changes
    } else {
      setAvailableSubjects([]);
    }
  }, [selectedClassId]);

  const handleStartAttendance = () => {
    if (selectedClassId && selectedSubjectId) {
      router.push(`/attendance/${selectedClassId}/${selectedSubjectId}`);
    }
  };
  
  const selectedClass = selectedClassId ? getClassById(selectedClassId) : null;

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
                setSelectedClassId(value);
              }}
              value={selectedClassId || ""}
            >
              <SelectTrigger id="class-select" className="w-full text-base py-6">
                <SelectValue placeholder="Choose a class..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classItem) => (
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
                 <FileTextIcon className="mr-2 h-5 w-5 text-muted-foreground" /> {/* Updated Icon */}
                Select Subject
              </Label>
              <Select
                onValueChange={(value) => {
                  setSelectedSubjectId(value);
                }}
                value={selectedSubjectId || ""}
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
            disabled={!selectedClassId || !selectedSubjectId}
            className="w-full text-lg py-6 mt-4"
          >
            Start Attendance <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
