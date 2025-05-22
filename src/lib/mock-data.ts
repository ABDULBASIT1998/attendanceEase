
import type { AppData, ClassItem, Student, Subject } from '@/types';

const LOCAL_STORAGE_KEY = 'attendeaseAppData';

const defaultSubjects: Subject[] = [
  { id: 'subj-math', name: 'Mathematics' },
  { id: 'subj-sci', name: 'Science' },
  { id: 'subj-eng', name: 'English' },
  { id: 'subj-hist', name: 'History' },
  { id: 'subj-phy', name: 'Physics' },
  { id: 'subj-chem', name: 'Chemistry' },
  { id: 'subj-bio', name: 'Biology' },
  { id: 'subj-cs', name: 'Computer Science' },
];

const generateDefaultStudents = (classId: string, classPrefix: string, count: number): Student[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${classId}-student-${i + 1}`,
    name: `${classPrefix} Student ${i + 1}`,
    rollNumber: `${classPrefix.toUpperCase()}${1001 + i}`,
    photoUrl: `https://placehold.co/100x100.png`,
    classId: classId,
  }));
};

const defaultClasses: ClassItem[] = [
  {
    id: 'class-10a',
    name: 'Class 10A',
    subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-hist'],
    students: generateDefaultStudents('class-10a', '10A', 25),
  },
  {
    id: 'class-10b',
    name: 'Class 10B',
    subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-hist'],
    students: generateDefaultStudents('class-10b', '10B', 22),
  },
  {
    id: 'class-11a',
    name: 'Class 11A',
    subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-phy', 'subj-chem'],
    students: generateDefaultStudents('class-11a', '11A', 30),
  },
  {
    id: 'class-11b',
    name: 'Class 11B',
    subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-bio', 'subj-cs'],
    students: generateDefaultStudents('class-11b', '11B', 28),
  },
];

const getDefaultAppData = (): AppData => ({
  subjects: [...defaultSubjects],
  classes: [...defaultClasses],
});

const loadAppData = (): AppData => {
  if (typeof window !== 'undefined') {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      try {
        return JSON.parse(storedData) as AppData;
      } catch (error) {
        console.error("Error parsing AppData from localStorage", error);
        // Fallback to default if parsing fails
      }
    }
  }
  return getDefaultAppData();
};

const saveAppData = (appData: AppData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
  }
};

let appData: AppData = loadAppData();
// Ensure data is saved initially if loaded from defaults
if (typeof window !== 'undefined' && !localStorage.getItem(LOCAL_STORAGE_KEY)) {
  saveAppData(appData);
}


// --- Subject Management ---
export const getAllSubjects = (): Subject[] => {
  return [...appData.subjects];
};

export const getSubjectById = (subjectId: string): Subject | undefined => {
  return appData.subjects.find(s => s.id === subjectId);
};

export const addSubject = (name: string): Subject => {
  const newSubject: Subject = {
    id: `subj-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name,
  };
  appData.subjects.push(newSubject);
  saveAppData(appData);
  return newSubject;
};

// --- Class Management ---
export const getAllClasses = (): ClassItem[] => {
  return [...appData.classes];
};

export const getClassById = (classId: string): ClassItem | undefined => {
  return appData.classes.find(c => c.id === classId);
};

export const addClass = (name: string, subjectIds: string[]): ClassItem => {
  const newClass: ClassItem = {
    id: `class-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name,
    subjectIds,
    students: [],
  };
  appData.classes.push(newClass);
  saveAppData(appData);
  return newClass;
};

// --- Student Management ---
export const getStudentsByClass = (classId: string): Student[] => {
  const classItem = getClassById(classId);
  return classItem ? [...classItem.students] : [];
};

export const addStudent = (
  classId: string,
  studentData: Omit<Student, 'id' | 'classId' | 'photoUrl'> & { photoUrl?: string }
): Student | null => {
  const classItem = getClassById(classId);
  if (!classItem) return null;

  const newStudent: Student = {
    ...studentData,
    id: `student-${studentData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    classId,
    photoUrl: studentData.photoUrl || `https://placehold.co/100x100.png`,
  };
  classItem.students.push(newStudent);
  saveAppData(appData);
  return newStudent;
};

// Utility to get subjects for a class
export const getSubjectsForClass = (classId: string): Subject[] => {
  const classItem = getClassById(classId);
  if (!classItem) return [];
  return appData.subjects.filter(subject => classItem.subjectIds.includes(subject.id));
}
