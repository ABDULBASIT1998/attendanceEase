export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  photoUrl?: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface ClassItem {
  id: string;
  name: string;
  subjects: Subject[];
  students: Student[];
}

export type AttendanceStatus = 'present' | 'absent' | 'pending';

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}
