
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

const generateRollNumber = (classItem: ClassItem, existingStudentId?: string): string => {
  const classPrefix = classItem.name.replace(/\s+/g, '').toUpperCase();
  const studentRollNumbers = (classItem.students || [])
    .filter(s => s.id !== existingStudentId) // Exclude current student if updating
    .map(s => s.rollNumber);
  let nextNumber = 1;
  while (studentRollNumbers.includes(`${classPrefix}-${String(nextNumber).padStart(3, '0')}`)) {
    nextNumber++;
  }
  return `${classPrefix}-${String(nextNumber).padStart(3, '0')}`;
};

const generateDefaultStudents = (classItem: ClassItem, count: number): Student[] => {
  const students: Student[] = [];
  const tempClassItemForRollNumber = { ...classItem, students: [] as Student[] };

  for (let i = 0; i < count; i++) {
    const studentName = `${classItem.name.replace('Class ', '')} Student ${i + 1}`;
    const studentId = `${classItem.id}-student-${i + 1}`;
    const studentSubjectIds = [...classItem.subjectIds]; 
    
    const rollNumber = generateRollNumber(tempClassItemForRollNumber); 
    
    const newStudent: Student = {
      id: studentId,
      name: studentName,
      rollNumber: rollNumber,
      photoUrl: `https://placehold.co/100x100.png`,
      classId: classItem.id,
      subjectIds: studentSubjectIds,
    };
    students.push(newStudent);
    tempClassItemForRollNumber.students.push(newStudent); 
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
        parsedData.classes = parsedData.classes.map(cls => ({
          ...cls,
          students: cls.students || [] 
        }));

        parsedData.classes.forEach(cls => {
          cls.students.forEach(s => {
            if (!s.subjectIds) {
              s.subjectIds = [...cls.subjectIds];
            }
            if (!s.rollNumber || s.rollNumber.startsWith("ROLL-")) { // Added check for old roll numbers
              s.rollNumber = generateRollNumber(cls, s.id); 
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
  const trimmedName = name.trim();
  const existingSubject = appData.subjects.find(s => s.name.toLowerCase() === trimmedName.toLowerCase());
  if (existingSubject) {
    throw new Error(`Subject "${trimmedName}" already exists.`);
  }
  const newSubject: Subject = {
    id: `subj-${trimmedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name: trimmedName,
  };
  appData.subjects.push(newSubject);
  saveAppData(appData);
  return newSubject;
};

export const updateSubject = (subjectId: string, newName: string): Subject | null => {
    const trimmedNewName = newName.trim();
    const subjectIndex = appData.subjects.findIndex(s => s.id === subjectId);
    if (subjectIndex === -1) {
        throw new Error("Subject not found.");
    }
    const existingSubject = appData.subjects.find(s => s.name.toLowerCase() === trimmedNewName.toLowerCase() && s.id !== subjectId);
    if (existingSubject) {
        throw new Error(`Subject name "${trimmedNewName}" already exists.`);
    }
    appData.subjects[subjectIndex].name = trimmedNewName;
    saveAppData(appData);
    return appData.subjects[subjectIndex];
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

export const updateClass = (classId: string, newName: string, newSubjectIds: string[]): ClassItem | null => {
    const trimmedNewName = newName.trim();
    const classIndex = appData.classes.findIndex(c => c.id === classId);
    if (classIndex === -1) {
        throw new Error("Class not found.");
    }
    const existingClass = appData.classes.find(c => c.name.toLowerCase() === trimmedNewName.toLowerCase() && c.id !== classId);
    if (existingClass) {
        throw new Error(`Class name "${trimmedNewName}" already exists.`);
    }

    const oldClassName = appData.classes[classIndex].name;
    appData.classes[classIndex].name = trimmedNewName;
    appData.classes[classIndex].subjectIds = newSubjectIds;

    // If class name changed, update student roll numbers and subject IDs if necessary
    if (oldClassName !== trimmedNewName) {
        appData.classes[classIndex].students.forEach(student => {
            student.rollNumber = generateRollNumber(appData.classes[classIndex], student.id);
        });
    }
    // Ensure students only have subjects that are part of the updated class subjects
    appData.classes[classIndex].students.forEach(student => {
        student.subjectIds = student.subjectIds.filter(subId => newSubjectIds.includes(subId));
    });


    saveAppData(appData);
    return appData.classes[classIndex];
};


// --- Student Management ---
export const getStudentsByClass = (classId: string): Student[] => {
  const classItem = getClassById(classId);
  return classItem ? [...classItem.students] : [];
};

export const getStudentsForSubjectInClass = (classId: string, subjectId: string): Student[] => {
  const classItem = getClassById(classId);
  if (!classItem) return [];
  return classItem.students.filter(student => student.subjectIds && student.subjectIds.includes(subjectId));
};

export const addStudent = (
  classId: string,
  studentData: Omit<Student, 'id' | 'classId' | 'photoUrl' | 'subjectIds' | 'rollNumber'> & { photoUrl?: string; studentSubjectIds: string[] }
): Student | null => {
  const classItem = getClassById(classId);
  if (!classItem) { 
      throw new Error("Class not found for adding student.");
  }

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
  if (!classItem.students) {
    classItem.students = [];
  }
  classItem.students.push(newStudent);
  saveAppData(appData);
  return newStudent;
};

export const updateStudent = (
    studentId: string,
    classId: string,
    updateData: Partial<Omit<Student, 'id' | 'classId' | 'rollNumber'>> & { studentSubjectIds?: string[] }
): Student | null => {
    const classItem = appData.classes.find(c => c.id === classId);
    if (!classItem || !classItem.students) {
        throw new Error("Class or student list not found.");
    }

    const studentIndex = classItem.students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
        throw new Error("Student not found in the specified class.");
    }

    const studentToUpdate = classItem.students[studentIndex];

    if (updateData.name) {
        studentToUpdate.name = updateData.name.trim();
    }
    if (updateData.photoUrl) {
        studentToUpdate.photoUrl = updateData.photoUrl;
    }
    if (updateData.studentSubjectIds) {
        // Ensure provided subject IDs are valid for the class
        const validStudentSubjects = updateData.studentSubjectIds.filter(id => classItem.subjectIds.includes(id));
        studentToUpdate.subjectIds = validStudentSubjects;
    }
    
    classItem.students[studentIndex] = studentToUpdate;
    saveAppData(appData);
    return studentToUpdate;
};


export const getSubjectsForClass = (classId: string): Subject[] => {
  const classItem = getClassById(classId);
  if (!classItem) return [];
  return appData.subjects.filter(subject => classItem.subjectIds.includes(subject.id));
};
