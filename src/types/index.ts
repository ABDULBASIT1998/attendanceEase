
export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  photoUrl?: string;
  classId: string; // To know which class the student belongs to
}

export interface Subject { // Global subject definition
  id: string;
  name: string;
}

export interface ClassItem {
  id: string;
  name: string;
  subjectIds: string[]; // IDs referencing global subjects
  students: Student[]; // Students are still directly nested
}

export type AttendanceStatus = 'present' | 'absent' | 'pending';

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

// Structure for data stored in localStorage
export interface AppData {
  classes: ClassItem[];
  subjects: Subject[]; // Global list of all subjects
}
