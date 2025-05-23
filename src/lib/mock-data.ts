
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

const generateRollNumber = (classItem: ClassItem): string => {
  const classPrefix = classItem.name.replace(/\s+/g, '').toUpperCase();
  // Ensure students array exists
  const studentRollNumbers = (classItem.students || []).map(s => s.rollNumber);
  let nextNumber = 1;
  // Check against existing roll numbers in the specific class
  while (studentRollNumbers.includes(`${classPrefix}-${String(nextNumber).padStart(3, '0')}`)) {
    nextNumber++;
  }
  return `${classPrefix}-${String(nextNumber).padStart(3, '0')}`;
};

const generateDefaultStudents = (classItem: ClassItem, count: number): Student[] => {
  const students: Student[] = [];
  const tempClassItemForRollNumber = { ...classItem, students: [] as Student[] }; // Simulate empty students for initial generation

  for (let i = 0; i < count; i++) {
    const studentName = `${classItem.name.replace('Class ', '')} Student ${i + 1}`;
    const studentId = `${classItem.id}-student-${i + 1}`;
    const studentSubjectIds = [...classItem.subjectIds]; 
    
    const rollNumber = generateRollNumber(tempClassItemForRollNumber); // Pass temp item
    
    const newStudent: Student = {
      id: studentId,
      name: studentName,
      rollNumber: rollNumber,
      photoUrl: `https://placehold.co/100x100.png`,
      classId: classItem.id,
      subjectIds: studentSubjectIds,
    };
    students.push(newStudent);
    tempClassItemForRollNumber.students.push(newStudent); // Add to temp item for next roll number
  }
  return students;
};


const getDefaultAppData = (): AppData => {
  const classes: ClassItem[] = [
    {
      id: 'class-10a',
      name: 'Class 10A',
      subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-hist'],
      students: [], 
    },
    {
      id: 'class-10b',
      name: 'Class 10B',
      subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-hist'],
      students: [],
    },
    {
      id: 'class-11a',
      name: 'Class 11A',
      subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-phy', 'subj-chem'],
      students: [],
    },
    {
      id: 'class-11b',
      name: 'Class 11B',
      subjectIds: ['subj-math', 'subj-sci', 'subj-eng', 'subj-bio', 'subj-cs'],
      students: [],
    },
  ];

  classes.forEach(cls => {
    let count = 20; 
    if(cls.id === 'class-10a') count = 25;
    if(cls.id === 'class-10b') count = 22;
    if(cls.id === 'class-11a') count = 30;
    if(cls.id === 'class-11b') count = 28;
    cls.students = generateDefaultStudents(cls, count);
  });

  return {
    subjects: [...defaultSubjects],
    classes: classes,
  };
};


const loadAppData = (): AppData => {
  if (typeof window !== 'undefined') {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as AppData;
        // Ensure all classes have a students array
        parsedData.classes = parsedData.classes.map(cls => ({
          ...cls,
          students: cls.students || [] 
        }));

        parsedData.classes.forEach(cls => {
          cls.students.forEach(s => {
            if (!s.subjectIds) {
              s.subjectIds = [...cls.subjectIds];
            }
            if (!s.rollNumber) { 
              s.rollNumber = generateRollNumber(cls); 
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
  const existingSubject = appData.subjects.find(s => s.name.toLowerCase() === name.toLowerCase().trim());
  if (existingSubject) {
    throw new Error(`Subject "${name}" already exists.`);
  }
  const newSubject: Subject = {
    id: `subj-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name: name.trim(),
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
  const trimmedName = name.trim();
  const existingClass = appData.classes.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
  if (existingClass) {
    throw new Error(`Class "${trimmedName}" already exists.`);
  }
  const newClass: ClassItem = {
    id: `class-${trimmedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name: trimmedName,
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

export const getStudentsForSubjectInClass = (classId: string, subjectId: string): Student[] => {
  const classItem = getClassById(classId);
  if (!classItem) return [];
  // Ensure students have subjectIds before filtering
  return classItem.students.filter(student => student.subjectIds && student.subjectIds.includes(subjectId));
};

export const addStudent = (
  classId: string,
  studentData: Omit<Student, 'id' | 'classId' | 'photoUrl' | 'subjectIds' | 'rollNumber'> & { photoUrl?: string; studentSubjectIds: string[] }
): Student | null => {
  const classItem = getClassById(classId);
  if (!classItem) return null;

  const classSubjects = classItem.subjectIds;
  const validStudentSubjects = studentData.studentSubjectIds.filter(id => classSubjects.includes(id));
  
  const rollNumber = generateRollNumber(classItem);

  const newStudent: Student = {
    name: studentData.name.trim(),
    rollNumber: rollNumber,
    id: `student-${studentData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    classId,
    photoUrl: studentData.photoUrl || `https://placehold.co/100x100.png`,
    subjectIds: validStudentSubjects,
  };
  classItem.students.push(newStudent); // This mutates appData.classes indirectly
  saveAppData(appData); // Save the entire appData
  return newStudent;
};

export const getSubjectsForClass = (classId: string): Subject[] => {
  const classItem = getClassById(classId);
  if (!classItem) return [];
  return appData.subjects.filter(subject => classItem.subjectIds.includes(subject.id));
};
