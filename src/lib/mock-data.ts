
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

const generateDefaultStudents = (classId: string, classPrefix: string, count: number, classSubjectIds: string[]): Student[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${classId}-student-${i + 1}`,
    name: `${classPrefix} Student ${i + 1}`,
    rollNumber: `${classPrefix.toUpperCase()}${1001 + i}`,
    photoUrl: `https://placehold.co/100x100.png`,
    classId: classId,
    subjectIds: [...classSubjectIds], // By default, enroll students in all class subjects
  }));
};

const defaultClasses: ClassItem[] = [
  {
    id: 'class-10a',
    name: 'Class 10A',
    subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-hist'],
    students: generateDefaultStudents('class-10a', '10A', 25, ['subj-math', 'subj-sci', 'subj-eng', 'subj-hist']),
  },
  {
    id: 'class-10b',
    name: 'Class 10B',
    subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-hist'],
    students: generateDefaultStudents('class-10b', '10B', 22, ['subj-math', 'subj-sci', 'subj-eng', 'subj-hist']),
  },
  {
    id: 'class-11a',
    name: 'Class 11A',
    subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-phy', 'subj-chem'],
    students: generateDefaultStudents('class-11a', '11A', 30, ['subj-math', 'subj-sci', 'subj-eng', 'subj-phy', 'subj-chem']),
  },
  {
    id: 'class-11b',
    name: 'Class 11B',
    subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-bio', 'subj-cs'],
    students: generateDefaultStudents('class-11b', '11B', 28, ['subj-math', 'subj-sci', 'subj-eng', 'subj-bio', 'subj-cs']),
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
        // Basic validation/migration could be added here if structure changes
        const parsedData = JSON.parse(storedData) as AppData;
        // Ensure students have subjectIds
        parsedData.classes.forEach(cls => {
          cls.students.forEach(s => {
            if (!s.subjectIds) {
              s.subjectIds = [...cls.subjectIds]; // Default to all class subjects if missing
            }
          });
        });
        return parsedData;
      } catch (error) {
        console.error("Error parsing AppData from localStorage", error);
      }
    }
  }
  return getDefaultAppData();
};

const saveAppData = (data: AppData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
};

let appData: AppData = loadAppData();
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
    students: [], // New classes start with no students
  };
  appData.classes.push(newClass);
  saveAppData(appData);
  return newClass;
};

// --- Student Management ---
// Gets ALL students in a class, regardless of their subject enrollment.
export const getStudentsByClass = (classId: string): Student[] => {
  const classItem = getClassById(classId);
  return classItem ? [...classItem.students] : [];
};

// Gets students from a specific class who are enrolled in a specific subject.
export const getStudentsForSubjectInClass = (classId: string, subjectId: string): Student[] => {
  const classItem = getClassById(classId);
  if (!classItem) return [];
  return classItem.students.filter(student => student.subjectIds.includes(subjectId));
};

export const addStudent = (
  classId: string,
  studentData: Omit<Student, 'id' | 'classId' | 'photoUrl' | 'subjectIds'> & { photoUrl?: string; studentSubjectIds: string[] }
): Student | null => {
  const classItem = getClassById(classId);
  if (!classItem) return null;

  // Validate that studentSubjectIds are part of the class's subjects
  const classSubjects = classItem.subjectIds;
  const validStudentSubjects = studentData.studentSubjectIds.filter(id => classSubjects.includes(id));

  const newStudent: Student = {
    name: studentData.name,
    rollNumber: studentData.rollNumber,
    id: `student-${studentData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    classId,
    photoUrl: studentData.photoUrl || `https://placehold.co/100x100.png`,
    subjectIds: validStudentSubjects,
  };
  classItem.students.push(newStudent);
  saveAppData(appData);
  return newStudent;
};

// Utility to get subjects taught in a class
export const getSubjectsForClass = (classId: string): Subject[] => {
  const classItem = getClassById(classId);
  if (!classItem) return [];
  return appData.subjects.filter(subject => classItem.subjectIds.includes(subject.id));
};
