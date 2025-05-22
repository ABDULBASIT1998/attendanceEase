import type { ClassItem, Student, Subject } from '@/types';

const commonSubjects: Subject[] = [
  { id: 'subj-math', name: 'Mathematics' },
  { id: 'subj-sci', name: 'Science' },
  { id: 'subj-eng', name: 'English' },
  { id: 'subj-hist', name: 'History' },
];

const generateStudents = (classPrefix: string, count: number): Student[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${classPrefix}-student-${i + 1}`,
    name: `${classPrefix} Student ${i + 1}`,
    rollNumber: `${classPrefix.toUpperCase()}${1001 + i}`,
    photoUrl: `https://placehold.co/100x100.png`,
  }));
};

export const mockClasses: ClassItem[] = [
  {
    id: 'class-10a',
    name: 'Class 10A',
    subjects: commonSubjects,
    students: generateStudents('10A', 25),
  },
  {
    id: 'class-10b',
    name: 'Class 10B',
    subjects: commonSubjects,
    students: generateStudents('10B', 22),
  },
  {
    id: 'class-11a',
    name: 'Class 11A',
    subjects: [
      ...commonSubjects,
      { id: 'subj-phy', name: 'Physics' },
      { id: 'subj-chem', name: 'Chemistry' },
    ],
    students: generateStudents('11A', 30),
  },
    {
    id: 'class-11b',
    name: 'Class 11B',
    subjects: [
      ...commonSubjects,
      { id: 'subj-bio', name: 'Biology' },
      { id: 'subj-cs', name: 'Computer Science' },
    ],
    students: generateStudents('11B', 28),
  },
];

export const getStudentsByClass = (classId: string): Student[] => {
  const classItem = mockClasses.find(c => c.id === classId);
  return classItem ? classItem.students : [];
};

export const getClassById = (classId: string): ClassItem | undefined => {
  return mockClasses.find(c => c.id === classId);
};

export const getSubjectById = (classId: string, subjectId: string): Subject | undefined => {
  const classItem = getClassById(classId);
  return classItem?.subjects.find(s => s.id === subjectId);
};
