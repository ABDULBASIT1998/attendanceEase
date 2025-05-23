
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { ClassItem, Subject } from '@/types';
import { ScrollArea } from '../ui/scroll-area';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: ClassItem;
  allSubjects: Subject[]; // All globally available subjects
  onUpdate: (classId: string, newName: string, newSubjectIds: string[]) => boolean; // Returns true on success
}

export function EditClassModal({ isOpen, onClose, classItem, allSubjects, onUpdate }: EditClassModalProps) {
  const [name, setName] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (classItem) {
      setName(classItem.name);
      setSelectedSubjectIds([...classItem.subjectIds]);
    }
  }, [classItem]);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("Class name cannot be empty.");
      return;
    }
    if (selectedSubjectIds.length === 0) {
      alert("Please select at least one subject for the class.");
      return;
    }
    setIsLoading(true);
    const success = onUpdate(classItem.id, trimmedName, selectedSubjectIds);
    if (success) {
      onClose();
    }
    setIsLoading(false);
  };

  if (!classItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>
            Update the details for "{classItem.name}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-class-name">Class Name</Label>
            <Input
              id="edit-class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label>Assign Subjects</Label>
            {allSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">No subjects available.</p>
            ) : (
              <ScrollArea className="h-48 mt-1 border rounded-md p-2">
                <div className="space-y-2">
                  {allSubjects.map(subject => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-class-subject-${subject.id}`}
                        checked={selectedSubjectIds.includes(subject.id)}
                        onCheckedChange={() => handleSubjectToggle(subject.id)}
                      />
                      <Label htmlFor={`edit-class-subject-${subject.id}`} className="font-normal cursor-pointer">
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
            <Button type="submit" disabled={isLoading || allSubjects.length === 0}>
              {isLoading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
