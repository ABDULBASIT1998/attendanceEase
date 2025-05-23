
"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Student, Subject, ClassItem } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classItem: ClassItem; // The class this student belongs to
  allGlobalSubjects: Subject[]; // All subjects, for name lookup
  onUpdate: (
    studentId: string, 
    classId: string, 
    updatedData: Partial<Omit<Student, 'id' | 'classId' | 'rollNumber'>> & { studentSubjectIds?: string[], photoFile?: File | null, photoUrl?: string | null }
  ) => boolean; // Returns true on success
}

export function EditStudentModal({ isOpen, onClose, student, classItem, allGlobalSubjects, onUpdate }: EditStudentModalProps) {
  const [name, setName] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const subjectsAvailableInClass = allGlobalSubjects.filter(sub => classItem.subjectIds.includes(sub.id));

  useEffect(() => {
    if (student) {
      setName(student.name);
      setSelectedSubjectIds([...student.subjectIds]);
      setPhotoPreviewUrl(student.photoUrl || null);
      setSelectedPhotoFile(null); // Reset file on new student load
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [student]);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
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
      // If no file is selected, but there was a preview, don't clear it
      // unless user explicitly wants to remove photo (future feature)
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl(null); // This will effectively use placeholder on update
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("Student name cannot be empty.");
      return;
    }
    if (selectedSubjectIds.length === 0 && subjectsAvailableInClass.length > 0) {
      alert("Please select at least one subject for the student.");
      return;
    }

    setIsLoading(true);
    
    // photoPreviewUrl will contain the new blob URL if a file was selected,
    // or the original student.photoUrl, or null if removed
    const updatePayload: Partial<Omit<Student, 'id' | 'classId' | 'rollNumber'>> & { studentSubjectIds?: string[], photoFile?: File | null, photoUrl?: string | null } = {
      name: trimmedName,
      studentSubjectIds: selectedSubjectIds,
    };

    if (selectedPhotoFile) {
        updatePayload.photoFile = selectedPhotoFile; // Pass the file for mock-data to handle (e.g. create blob URL)
    } else if (photoPreviewUrl !== student.photoUrl) {
        // This case handles if photo was removed (photoPreviewUrl is null)
        // or if somehow photoUrl was directly manipulated (less likely here)
        updatePayload.photoUrl = photoPreviewUrl;
    }
    // If photoPreviewUrl is the same as student.photoUrl and no new file, photoUrl is not explicitly sent, so no change

    const success = onUpdate(student.id, student.classId, updatePayload);
    if (success) {
      onClose();
    }
    setIsLoading(false);
  };

  if (!student || !classItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Student: {student.name}</DialogTitle>
          <DialogDescription>
            Update details for student in class "{classItem.name}". Roll No: {student.rollNumber} (non-editable).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-student-name">Student Name</Label>
            <Input
              id="edit-student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-photo">Student Photo</Label>
            <div className="flex items-center space-x-4">
              {photoPreviewUrl ? (
                <Image src={photoPreviewUrl} alt="Student preview" width={80} height={80} className="rounded-md object-cover border" data-ai-hint="student photo preview" />
              ) : (
                <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center border">
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col space-y-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> {selectedPhotoFile ? "Change" : "Upload Photo"}
                </Button>
                {photoPreviewUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto} className="text-xs">
                        Remove Photo
                    </Button>
                )}
              </div>
              <Input
                id="edit-photo"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Simulated upload. Image is for preview only.</p>
          </div>
          
          <div>
            <Label>Assign Subjects</Label>
            {subjectsAvailableInClass.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                This class has no subjects assigned. Student cannot be enrolled in any subject.
              </p>
            ) : (
              <ScrollArea className="h-40 mt-1 border rounded-md p-2">
                <div className="space-y-2">
                  {subjectsAvailableInClass.map(subject => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-student-subject-${subject.id}`}
                        checked={selectedSubjectIds.includes(subject.id)}
                        onCheckedChange={() => handleSubjectToggle(subject.id)}
                      />
                      <Label htmlFor={`edit-student-subject-${subject.id}`} className="font-normal cursor-pointer">
                        {subject.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (subjectsAvailableInClass.length > 0 && selectedSubjectIds.length === 0)}>
              {isLoading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
