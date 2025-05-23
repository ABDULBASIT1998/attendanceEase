
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Subject } from '@/types';

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  onUpdate: (subjectId: string, newName: string) => boolean; // Returns true on success
}

export function EditSubjectModal({ isOpen, onClose, subject, onUpdate }: EditSubjectModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
    }
  }, [subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      // Basic validation, can be enhanced with react-hook-form if needed
      alert("Subject name cannot be empty.");
      return;
    }
    setIsLoading(true);
    const success = onUpdate(subject.id, name.trim());
    if (success) {
      onClose();
    }
    setIsLoading(false);
  };

  if (!subject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Update the name for the subject "{subject.name}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-subject-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-subject-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
