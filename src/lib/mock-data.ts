
import type { AppData, ClassItem, Student, Subject } from '@/types';
import Papa from 'papaparse';


const LOCAL_STORAGE_KEY = 'attendeaseAppData';
const CURRENT_APP_DATA_VERSION = 2; // Increment this if data structure changes significantly

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

const indianNames = [
  // Female names
  "Aanya Sharma", "Aadhya Singh", "Anika Patel", "Diya Kumar", "Isha Reddy", "Kavya Joshi", "Myra Gupta", "Navya Agarwal", "Pari Mishra", "Riya Verma", 
  "Saanvi Das", "Siya Bose", "Tara Menon", "Zara Iyer", "Priya Nair", "Meera Rao", "Lakshmi Pillai", "Gita Desai", "Anjali Shah", "Sneha Reddy",
  "Aarushi Mehta", "Advika Chatterjee", "Amrita Banerjee", "Avani Srinivasan", "Charvi Mohan", "Devika Krishnan", "Esha Bhatt", "Gauri Pandit", "Inaya Khan", "Jiya Chakraborty",
  // Male names
  "Aarav Kumar", "Advik Reddy", "Arjun Singh", "Aryan Patel", "Dev Joshi", "Ishaan Gupta", "Kabir Agarwal", "Krishna Mishra", "Mohan Verma", "Neel Das", 
  "Om Bose", "Parth Menon", "Rahul Iyer", "Rohan Nair", "Samar Rao", "Shiva Pillai", "Vihaan Desai", "Yash Shah", "Ravi Mehta", "Suresh Chatterjee",
  "Aditya Banerjee", "Akshay Srinivasan", "Ansh Mohan", "Arnav Krishnan", "Ayush Bhatt", "Dhruv Pandit", "Harsh Khan", "Jay Chakraborty", "Kian Sharma", "Madhav Singh"
];


const generateRollNumber = (classItem: ClassItem, existingStudentId?: string): string => {
  const classPrefix = classItem.name.replace(/\s+/g, '').toUpperCase();
  
  const studentRollNumbers = (classItem.students || [])
    .filter(s => s.id !== existingStudentId) 
    .map(s => s.rollNumber);

  let maxNumber = 0;
  studentRollNumbers.forEach(rn => {
    const parts = rn.split('-');
    if (parts.length > 1) {
        const numStr = parts[parts.length - 1];
        if (numStr && !isNaN(parseInt(numStr))) {
          const num = parseInt(numStr);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
    }
  });
  
  const nextNumber = maxNumber + 1;
  return `${classPrefix}-${String(nextNumber).padStart(3, '0')}`;
};


const generateDefaultStudents = (classItem: ClassItem, count: number): Student[] => {
  const students: Student[] = [];
  // Create a temporary class item that will accumulate students for roll number generation.
  // This ensures roll numbers are unique within this batch generation.
  const tempClassItemForRollNumber = { ...classItem, students: [] as Student[] };
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let studentName = indianNames[Math.floor(Math.random() * indianNames.length)];
    let attempt = 0;
    // Try to get a unique name from the list for this batch of students
    while(usedNames.has(studentName) && attempt < indianNames.length) {
        studentName = indianNames[Math.floor(Math.random() * indianNames.length)];
        attempt++;
    }
    usedNames.add(studentName);

    const studentId = `${classItem.id}-student-${studentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`; // Ensure unique ID
    
    // Assign a random subset of the class's subjects to the student
    const numSubjectsToAssign = Math.max(1, Math.floor(Math.random() * classItem.subjectIds.length) + 1);
    const studentSubjectIds = [...classItem.subjectIds].sort(() => 0.5 - Math.random()).slice(0, numSubjectsToAssign);
        
    // Generate roll number using the temporary class item
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
    // Add the newly created student to the temporary class item for the next roll number generation
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
    version: CURRENT_APP_DATA_VERSION,
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
        // Check version for data migration/re-seeding
        if (parsedData.version && parsedData.version >= CURRENT_APP_DATA_VERSION) {
            // Ensure students array exists and initialize if not (for older structures that might have been partially migrated)
            parsedData.classes = parsedData.classes.map(cls => ({
              ...cls,
              students: cls.students || [] 
            }));
            // Further integrity checks can be added here if needed for specific fields
            return parsedData;
        } else {
            // Data is old or unversioned, re-seed with new defaults
            console.log("Old or unversioned app data found. Re-seeding with new defaults.");
            const defaultData = getDefaultAppData();
            saveAppData(defaultData); // Save the fresh data immediately
            return defaultData;
        }
      } catch (error) {
        console.error("Error parsing AppData from localStorage, re-seeding.", error);
        // Fallback to default if parsing fails
      }
    }
  }
  // If no stored data or if running in a non-browser environment (or error occurred above)
  const defaultData = getDefaultAppData();
  // Only save if in browser and there was no data initially
  if (typeof window !== 'undefined' && !localStorage.getItem(LOCAL_STORAGE_KEY)) {
    saveAppData(defaultData);
  }
  return defaultData;
};

const saveAppData = (data: AppData) => {
  if (typeof window !== 'undefined') {
    data.version = CURRENT_APP_DATA_VERSION; // Ensure current version is saved
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
};

let appData: AppData = loadAppData();


// --- Subject Management ---
export const getAllSubjects = (): Subject[] => {
  return [...appData.subjects];
};

export const getSubjectById = (subjectId: string): Subject | undefined => {
  return appData.subjects.find(s => s.id === subjectId);
};

export const getSubjectByName = (name: string): Subject | undefined => {
  const trimmedName = name.trim().toLowerCase();
  return appData.subjects.find(s => s.name.trim().toLowerCase() === trimmedName);
}

export const addSubject = (name: string): Subject => {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Subject name cannot be empty.");
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
    if (!trimmedNewName) throw new Error("Subject name cannot be empty.");
    const subjectIndex = appData.subjects.findIndex(s => s.id === subjectId);
    if (subjectIndex === -1) {
        throw new Error("Subject not found.");
    }
    // Check if another subject with the new name already exists
    const existingSubject = appData.subjects.find(s => s.name.toLowerCase() === trimmedNewName.toLowerCase() && s.id !== subjectId);
    if (existingSubject) {
        throw new Error(`Subject name "${trimmedNewName}" already exists.`);
    }
    appData.subjects[subjectIndex].name = trimmedNewName;
    saveAppData(appData);
    return appData.subjects[subjectIndex];
};

export const deleteSubject = (subjectId: string): void => {
    const subjectIndex = appData.subjects.findIndex(s => s.id === subjectId);
    if (subjectIndex === -1) {
        throw new Error("Subject not found for deletion.");
    }
    appData.subjects.splice(subjectIndex, 1);

    // Remove this subject from all classes and students
    appData.classes.forEach(cls => {
        cls.subjectIds = cls.subjectIds.filter(id => id !== subjectId);
        cls.students.forEach(student => {
            student.subjectIds = student.subjectIds.filter(id => id !== subjectId);
        });
    });

    saveAppData(appData);
};


// --- Class Management ---
export const getAllClasses = (): ClassItem[] => {
  return [...appData.classes];
};

export const getClassById = (classId: string): ClassItem | undefined => {
  return appData.classes.find(c => c.id === classId);
};

export const getClassByName = (name: string): ClassItem | undefined => {
    const trimmedName = name.trim().toLowerCase();
    return appData.classes.find(c => c.name.trim().toLowerCase() === trimmedName);
}

export const addClass = (name: string, subjectIds: string[]): ClassItem => {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Class name cannot be empty.");
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
    if (!trimmedNewName) throw new Error("Class name cannot be empty.");
    const classIndex = appData.classes.findIndex(c => c.id === classId);
    if (classIndex === -1) {
        throw new Error("Class not found.");
    }
    const existingClassWithSameName = appData.classes.find(c => c.name.toLowerCase() === trimmedNewName.toLowerCase() && c.id !== classId);
    if (existingClassWithSameName) {
        throw new Error(`Class name "${trimmedNewName}" already exists.`);
    }

    const oldClass = { ...appData.classes[classIndex] }; 
    const classToUpdate = appData.classes[classIndex];
    
    const nameChanged = oldClass.name !== trimmedNewName;
    classToUpdate.name = trimmedNewName;
    classToUpdate.subjectIds = newSubjectIds;

    if (nameChanged) {
        // Re-generate roll numbers for all students in this class using a temporary copy to avoid conflicts
        const studentsCopy = [...classToUpdate.students];
        const tempClassForRollGen = { ...classToUpdate, students: [] as Student[] };
        classToUpdate.students = []; // Clear original students before re-adding with new roll numbers

        studentsCopy.forEach(student => {
            const newRollNumber = generateRollNumber(tempClassForRollGen, student.id);
            const updatedStudent = {...student, rollNumber: newRollNumber};
            classToUpdate.students.push(updatedStudent);
            tempClassForRollGen.students.push(updatedStudent);
        });
    }
    
    classToUpdate.students.forEach(student => {
        student.subjectIds = student.subjectIds.filter(subId => newSubjectIds.includes(subId));
    });

    saveAppData(appData);
    return classToUpdate;
};

export const deleteClass = (classId: string): void => {
    const classIndex = appData.classes.findIndex(c => c.id === classId);
    if (classIndex === -1) {
        throw new Error("Class not found for deletion.");
    }
    appData.classes.splice(classIndex, 1);
    saveAppData(appData);
};


// --- Student Management ---
export const getStudentsByClass = (classId: string): Student[] => {
  const classItem = getClassById(classId);
  return classItem ? [...(classItem.students || [])] : [];
};

export const getStudentsForSubjectInClass = (classId: string, subjectId: string): Student[] => {
  const classItem = getClassById(classId);
  if (!classItem || !classItem.students) return [];
  return classItem.students.filter(student => student.subjectIds && student.subjectIds.includes(subjectId));
};

export const addStudent = (
  classId: string,
  studentData: { name: string; studentSubjectIds: string[]; photoUrl?: string }
): Student => {
  const classItem = appData.classes.find(c => c.id === classId);
  if (!classItem) { 
      throw new Error("Class not found for adding student.");
  }
  const trimmedName = studentData.name.trim();
  if(!trimmedName) throw new Error("Student name cannot be empty.");

  const classSubjects = classItem.subjectIds;
  const validStudentSubjects = studentData.studentSubjectIds.filter(id => classSubjects.includes(id));
  
  const rollNumber = generateRollNumber(classItem);

  const newStudent: Student = {
    name: trimmedName,
    rollNumber: rollNumber,
    id: `student-${trimmedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    classId,
    photoUrl: studentData.photoUrl || `https://placehold.co/100x100.png?text=${trimmedName.charAt(0)}`, 
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
        const trimmedName = updateData.name.trim();
        if(!trimmedName) throw new Error("Student name cannot be empty.");
        studentToUpdate.name = trimmedName;
    }
    if (updateData.photoUrl !== undefined) { 
        studentToUpdate.photoUrl = updateData.photoUrl;
    }
    if (updateData.studentSubjectIds) {
        const validStudentSubjects = updateData.studentSubjectIds.filter(id => classItem.subjectIds.includes(id));
        studentToUpdate.subjectIds = validStudentSubjects;
    }
    
    classItem.students[studentIndex] = studentToUpdate;
    saveAppData(appData);
    return studentToUpdate;
};

export const deleteStudent = (classId: string, studentId: string): void => {
    const classItem = appData.classes.find(c => c.id === classId);
    if (!classItem || !classItem.students) {
        throw new Error("Class or student list not found for deleting student.");
    }
    const studentIndex = classItem.students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
        throw new Error("Student not found for deletion.");
    }
    classItem.students.splice(studentIndex, 1);
    saveAppData(appData);
};

export type BulkUploadResult = {
    successCount: number;
    errorCount: number;
    errors: string[];
};

export const addMultipleStudents = (csvText: string): BulkUploadResult => {
    const result: BulkUploadResult = { successCount: 0, errorCount: 0, errors: [] };
    
    const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
        parsed.errors.forEach(err => result.errors.push(`CSV Parsing Error (Row ${err.row}): ${err.message}`));
        result.errorCount += parsed.errors.length; 
        if (result.errors.length > 0) return result;
    }
    
    const requiredHeaders = ["Student Name", "Class Name", "Subjects"];
    const actualHeaders = parsed.meta.fields || []; 
    for (const header of requiredHeaders) {
        if (!actualHeaders.includes(header)) {
            result.errors.push(`CSV Error: Missing required header column: "${header}". Ensure your CSV has headers: ${requiredHeaders.join(', ')}.`);
            result.errorCount = parsed.data.length; 
            return result;
        }
    }


    parsed.data.forEach((row: any, index: number) => {
        const studentName = row["Student Name"]?.trim();
        const className = row["Class Name"]?.trim();
        const subjectsStr = row["Subjects"]?.trim();

        if (!studentName) {
            result.errors.push(`Row ${index + 2}: Student Name is missing.`);
            result.errorCount++;
            return; 
        }
        if (!className) {
            result.errors.push(`Row ${index + 2} (Student: ${studentName}): Class Name is missing.`);
            result.errorCount++;
            return; 
        }
        
        const classItem = getClassByName(className);
        if (!classItem) {
            result.errors.push(`Row ${index + 2} (Student: ${studentName}): Class "${className}" not found.`);
            result.errorCount++;
            return; 
        }

        let studentSubjectIds: string[] = [];
        if (subjectsStr) {
            const subjectNames = subjectsStr.split(',').map(s => s.trim()).filter(s => s); 
            let subjectErrorOccurred = false;
            for (const subName of subjectNames) {
                const subject = getSubjectByName(subName);
                if (!subject) {
                    result.errors.push(`Row ${index + 2} (Student: ${studentName}): Subject "${subName}" not found globally.`);
                    subjectErrorOccurred = true;
                    break; 
                }
                if (!classItem.subjectIds.includes(subject.id)) {
                     result.errors.push(`Row ${index + 2} (Student: ${studentName}): Subject "${subName}" is not assigned to class "${className}".`);
                    subjectErrorOccurred = true;
                    break;
                }
                studentSubjectIds.push(subject.id);
            }
            if (subjectErrorOccurred) {
                result.errorCount++;
                return; // Skip this student due to subject error
            }
        }

        try {
            addStudent(classItem.id, {
                name: studentName,
                studentSubjectIds: studentSubjectIds,
            });
            result.successCount++;
        } catch (e: any) {
            result.errors.push(`Row ${index + 2} (Student: ${studentName}): ${e.message}`);
            result.errorCount++;
        }
    });

    saveAppData(appData); 
    return result;
};


// --- Helper ---
export const getSubjectsForClass = (classId: string): Subject[] => {
  const classItem = getClassById(classId);
  if (!classItem) return [];
  return appData.subjects.filter(subject => classItem.subjectIds.includes(subject.id));
};

// Utility for development: Reset and seed data
export const resetAndSeedData = () => {
  appData = getDefaultAppData();
  saveAppData(appData);
  // Optionally, reload the page to reflect changes if called from UI
  // if (typeof window !== 'undefined') { window.location.reload(); }
};
// if (typeof window !== 'undefined') { (window as any).resetAndSeedData = resetAndSeedData; }

// Initial load of appData
appData = loadAppData();
