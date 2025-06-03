
import type { AppData, ClassItem, Student, Subject } from '@/types';
import Papa from 'papaparse';


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
    .filter(s => s.id !== existingStudentId) // Exclude the current student if updating
    .map(s => s.rollNumber);

  let maxNumber = 0;
  studentRollNumbers.forEach(rn => {
    const parts = rn.split('-');
    const numStr = parts[parts.length -1];
    if (numStr && !isNaN(parseInt(numStr))) {
      const num = parseInt(numStr);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  });
  
  const nextNumber = maxNumber + 1;
  return `${classPrefix}-${String(nextNumber).padStart(3, '0')}`;
};


const generateDefaultStudents = (classItem: ClassItem, count: number): Student[] => {
  const students: Student[] = [];
  const tempClassItemForRollNumber = { ...classItem, students: [] as Student[] };
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let studentName = indianNames[Math.floor(Math.random() * indianNames.length)];
    let attempt = 0;
    while(usedNames.has(studentName) && attempt < indianNames.length) { // Avoid duplicate names within the same class generation
        studentName = indianNames[Math.floor(Math.random() * indianNames.length)];
        attempt++;
    }
    usedNames.add(studentName);

    const studentId = `${classItem.id}-student-${studentName.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`;
    const numSubjectsToAssign = Math.max(1, Math.floor(Math.random() * classItem.subjectIds.length) + 1);
    const studentSubjectIds = [...classItem.subjectIds].sort(() => 0.5 - Math.random()).slice(0, numSubjectsToAssign);
        
    const rollNumber = generateRollNumber(tempClassItemForRollNumber); 
    
    const newStudent: Student = {
      id: studentId,
      name: studentName,
      rollNumber: rollNumber,
      photoUrl: `https://placehold.co/100x100.png`, // data-ai-hint will be added in component
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
        // Ensure students array exists and initialize if not
        parsedData.classes = parsedData.classes.map(cls => ({
          ...cls,
          students: cls.students || [] 
        }));

        // Ensure roll numbers and subjects are correctly initialized for older data structures
        parsedData.classes.forEach(cls => {
          const tempClassForRollGen = { ...cls, students: [] as Student[] }; // Temporary class for accurate roll gen
          cls.students.forEach(s => {
            if (!s.subjectIds || s.subjectIds.length === 0) {
               // Assign all class subjects if student has none, or a random subset
              const numSubjectsToAssign = Math.max(1, Math.floor(Math.random() * cls.subjectIds.length) + 1);
              s.subjectIds = [...cls.subjectIds].sort(() => 0.5 - Math.random()).slice(0, numSubjectsToAssign);
            }
            // Regenerate roll number if it seems invalid or missing based on current class name
            if (!s.rollNumber || !s.rollNumber.startsWith(cls.name.replace(/\s+/g, '').toUpperCase() + "-")) { 
              s.rollNumber = generateRollNumber(tempClassForRollGen, s.id); // Pass existing ID to avoid self-conflict
            }
            tempClassForRollGen.students.push(s); // Add to temp class for next student's roll gen
          });
        });
        return parsedData;
      } catch (error) {
        console.error("Error parsing AppData from localStorage", error);
        // Fallback to default if parsing fails
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

// Ensure data is saved if it was just loaded as default
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
    students: [], // Initialize with an empty student array
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
    // Check if another class with the new name already exists
    const existingClassWithSameName = appData.classes.find(c => c.name.toLowerCase() === trimmedNewName.toLowerCase() && c.id !== classId);
    if (existingClassWithSameName) {
        throw new Error(`Class name "${trimmedNewName}" already exists.`);
    }

    const oldClass = { ...appData.classes[classIndex] }; // For comparison
    const classToUpdate = appData.classes[classIndex];
    
    classToUpdate.name = trimmedNewName;
    classToUpdate.subjectIds = newSubjectIds;

    // If class name changed, update roll numbers for all students in this class
    if (oldClass.name !== trimmedNewName) {
        const tempClassForRollGen = { ...classToUpdate, students: [] as Student[] }; // Fresh list for re-generation
        classToUpdate.students.forEach(student => {
            student.rollNumber = generateRollNumber(tempClassForRollGen, student.id);
            tempClassForRollGen.students.push(student); // Add to temp as we go
        });
    }
    // Ensure students' subject enrollments are still valid for the class
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
    // Students are part of the class object, so they are deleted too
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
  // Filter students who are enrolled in the specific subject
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

  // Ensure student subjects are a subset of class subjects
  const classSubjects = classItem.subjectIds;
  const validStudentSubjects = studentData.studentSubjectIds.filter(id => classSubjects.includes(id));
  
  const rollNumber = generateRollNumber(classItem);

  const newStudent: Student = {
    name: trimmedName,
    rollNumber: rollNumber,
    id: `student-${trimmedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    classId,
    photoUrl: studentData.photoUrl || `https://placehold.co/100x100.png`, // data-ai-hint will be added in component
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
    classId: string, // Class ID is important for finding the student
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

    // Update name if provided
    if (updateData.name) {
        const trimmedName = updateData.name.trim();
        if(!trimmedName) throw new Error("Student name cannot be empty.");
        studentToUpdate.name = trimmedName;
        // Note: Roll number does not change if name changes, it's fixed upon creation unless class name changes.
    }
    // Update photoUrl if provided (can be null to remove photo)
    if (updateData.photoUrl !== undefined) { 
        studentToUpdate.photoUrl = updateData.photoUrl;
    }
    // Update subject enrollments if provided
    if (updateData.studentSubjectIds) {
        // Ensure student subjects are a subset of class subjects
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

// For Bulk Upload
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
        result.errorCount += parsed.errors.length; // Increment error count for each parsing error
        // No need to return early, let it try to process what it can, or handle as fatal
        // For now, we'll make parsing errors fatal for the whole batch for simplicity
        if (result.errors.length > 0) return result;
    }
    
    const requiredHeaders = ["Student Name", "Class Name", "Subjects"];
    const actualHeaders = parsed.meta.fields || []; // Get actual headers from parsed data
    for (const header of requiredHeaders) {
        if (!actualHeaders.includes(header)) {
            result.errors.push(`CSV Error: Missing required header column: "${header}". Ensure your CSV has headers: ${requiredHeaders.join(', ')}.`);
            result.errorCount = parsed.data.length; // Mark all as error if headers missing
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
            return; // Skip this row
        }
        if (!className) {
            result.errors.push(`Row ${index + 2} (Student: ${studentName}): Class Name is missing.`);
            result.errorCount++;
            return; // Skip this row
        }
        
        const classItem = getClassByName(className);
        if (!classItem) {
            result.errors.push(`Row ${index + 2} (Student: ${studentName}): Class "${className}" not found.`);
            result.errorCount++;
            return; // Skip this row
        }

        let studentSubjectIds: string[] = [];
        if (subjectsStr) {
            const subjectNames = subjectsStr.split(',').map(s => s.trim()).filter(s => s); // Filter out empty strings after split
            for (const subName of subjectNames) {
                const subject = getSubjectByName(subName);
                if (!subject) {
                    result.errors.push(`Row ${index + 2} (Student: ${studentName}): Subject "${subName}" not found.`);
                    result.errorCount++;
                    return; // Stop processing this student if a subject is invalid
                }
                // Check if the subject is actually part of the class the student is being added to
                if (!classItem.subjectIds.includes(subject.id)) {
                     result.errors.push(`Row ${index + 2} (Student: ${studentName}): Subject "${subName}" is not assigned to class "${className}".`);
                    result.errorCount++;
                    return; // Stop processing this student
                }
                studentSubjectIds.push(subject.id);
            }
        } else {
            // If no subjects string is provided, student is enrolled in no specific subjects.
            // This is valid if the student is just in the class but not taking any specific subjects from the class list.
        }


        try {
            addStudent(classItem.id, {
                name: studentName,
                studentSubjectIds: studentSubjectIds,
                // photoUrl can be omitted for default placeholder
            });
            result.successCount++;
        } catch (e: any) {
            result.errors.push(`Row ${index + 2} (Student: ${studentName}): ${e.message}`);
            result.errorCount++;
        }
    });

    saveAppData(appData); // Save once after all processing
    return result;
};


// --- Helper ---
export const getSubjectsForClass = (classId: string): Subject[] => {
  const classItem = getClassById(classId);
  if (!classItem) return [];
  // Filter global subjects based on IDs stored in classItem
  return appData.subjects.filter(subject => classItem.subjectIds.includes(subject.id));
};

// Utility for development: Reset and seed data
export const resetAndSeedData = () => {
  appData = getDefaultAppData();
  saveAppData(appData);
};
// Expose for debugging if needed (e.g., from browser console)
// if (typeof window !== 'undefined') { (window as any).resetAndSeedData = resetAndSeedData; }

// Ensure data is initialized and saved if not present
if (typeof window !== 'undefined' && !localStorage.getItem(LOCAL_STORAGE_KEY)) {
  appData = getDefaultAppData(); // Load defaults
  saveAppData(appData);        // Save them
} else {
  appData = loadAppData(); // Load existing
}
