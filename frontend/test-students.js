// Test script to add 5 students in different departments
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xpejwpfyusjppgnntaig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWp3cGZ5dXNqcHBnbm50YWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Nzc3NzAsImV4cCI6MjA1MDI1Mzc3MH0.Lx6k7RJELvLCrNmY8Iq2OLT9YdTJWtEPgO_QC7xjjlc';

const supabase = createClient(supabaseUrl, supabaseKey);

const generateStudentId = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `ST${year}${random}`;
};

const testStudents = [
  {
    name: "أحمد محمد علي",
    name_en: "Ahmed Mohammed Ali",
    national_id_passport: "1234567890123",
    gender: "male",
    birth_date: "2006-03-15",
    nationality: "ليبي",
    phone: "0912345678",
    email: "ahmed@example.com",
    address: "طرابلس، حي الأندلس",
    sponsor_name: "محمد علي أحمد",
    sponsor_contact: "0913456789",
    academic_history: "الثانوية العامة - مدرسة طرابلس الثانوية",
    academic_score: "85.5%",
    department_id: "DEPT_COMPUTER_SCIENCE", // Computer Science
    year: 1,
    status: "active",
    enrollment_date: "2025-01-01"
  },
  {
    name: "فاطمة عبدالله محمد",
    name_en: "Fatima Abdullah Mohammed",
    national_id_passport: "2345678901234",
    gender: "female",
    birth_date: "2007-07-22",
    nationality: "ليبي",
    phone: "0923456789",
    email: "fatima@example.com",
    address: "بنغازي، حي الصابري",
    sponsor_name: "عبدالله محمد سالم",
    sponsor_contact: "0924567890",
    academic_history: "الثانوية العامة - مدرسة بنغازي النموذجية",
    academic_score: "92.3%",
    department_id: "DEPT_MANAGEMENT", // Business Management
    year: 1,
    status: "active",
    enrollment_date: "2025-01-01"
  },
  {
    name: "عمر سالم أحمد",
    name_en: "Omar Salem Ahmed",
    national_id_passport: "3456789012345",
    gender: "male",
    birth_date: "2006-11-08",
    nationality: "ليبي",
    phone: "0934567890",
    email: "omar@example.com",
    address: "مصراتة، حي الزهور",
    sponsor_name: "سالم أحمد عمر",
    sponsor_contact: "0935678901",
    academic_history: "الثانوية العامة - مدرسة مصراتة المركزية",
    academic_score: "78.9%",
    department_id: "DEPT_ENGINEERING", // Engineering
    year: 1,
    status: "active",
    enrollment_date: "2025-01-01"
  },
  {
    name: "عائشة يوسف محمد",
    name_en: "Aisha Youssef Mohammed",
    national_id_passport: "4567890123456",
    gender: "female",
    birth_date: "2007-02-14",
    nationality: "ليبي",
    phone: "0945678901",
    email: "aisha@example.com",
    address: "سبها، حي الجامعة",
    sponsor_name: "يوسف محمد عبدالله",
    sponsor_contact: "0946789012",
    academic_history: "الثانوية العامة - مدرسة سبها الثانوية",
    academic_score: "88.7%",
    department_id: "DEPT_MEDICINE", // Medicine
    year: 1,
    status: "active",
    enrollment_date: "2025-01-01"
  },
  {
    name: "خالد إبراهيم سالم",
    name_en: "Khalid Ibrahim Salem",
    national_id_passport: "5678901234567",
    gender: "male",
    birth_date: "2006-09-30",
    nationality: "ليبي",
    phone: "0956789012",
    email: "khalid@example.com",
    address: "الزاوية، حي النصر",
    sponsor_name: "إبراهيم سالم خالد",
    sponsor_contact: "0957890123",
    academic_history: "الثانوية العامة - مدرسة الزاوية الحديثة",
    academic_score: "81.4%",
    department_id: "DEPT_LAW", // Law
    year: 1,
    status: "active",
    enrollment_date: "2025-01-01"
  }
];

async function addTestStudents() {
  console.log('🚀 Starting to add test students...');
  
  for (let i = 0; i < testStudents.length; i++) {
    const student = testStudents[i];
    const studentId = generateStudentId();
    
    console.log(`\n📝 Adding student ${i + 1}/5: ${student.name}`);
    
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          id: studentId,
          ...student
        }])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error adding ${student.name}:`, error);
      } else {
        console.log(`✅ Successfully added ${student.name} (ID: ${studentId})`);
      }
    } catch (err) {
      console.error(`❌ Exception adding ${student.name}:`, err);
    }
    
    // Small delay between insertions
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎉 Test student creation completed!');
}

// Run the script
addTestStudents().catch(console.error);
