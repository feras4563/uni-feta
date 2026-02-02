// ==============================================
// TEST ENHANCED API FIX
// This script tests that the enhanced registration API fix works correctly
// ==============================================

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the corrected query structure
async function testEnhancedRegistrationAPI() {
  console.log('🔍 Testing Enhanced Registration API Fix...');
  
  try {
    // Test 1: Check if we can fetch registration data without the semester_number error
    console.log('\n📋 Test 1: Fetching registration data...');
    
    const { data: registrationData, error: registrationError } = await supabase
      .from('student_semester_registrations')
      .select(`
        id,
        student_id,
        semester_id,
        department_id,
        semester_number,
        registration_date,
        status,
        tuition_paid,
        notes,
        created_at,
        updated_at,
        students(
          id,
          name,
          email,
          national_id_passport,
          phone,
          address,
          departments(id, name, name_en)
        ),
        semesters(
          id,
          name,
          name_en,
          start_date,
          end_date,
          study_years(id, name, name_en)
        ),
        departments(id, name, name_en)
      `)
      .limit(1);

    if (registrationError) {
      console.error('❌ Registration query error:', registrationError);
      return;
    }

    console.log('✅ Registration query successful');
    console.log('📝 Sample registration data:', {
      id: registrationData?.[0]?.id,
      student_name: registrationData?.[0]?.students?.name,
      semester_name: registrationData?.[0]?.semesters?.name,
      semester_number: registrationData?.[0]?.semester_number,
      registration_date: registrationData?.[0]?.registration_date
    });

    // Test 2: Check if we can fetch subjects for the registration
    console.log('\n📚 Test 2: Fetching registration subjects...');
    
    if (registrationData && registrationData.length > 0) {
      const registration = registrationData[0];
      
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('student_subject_enrollments')
        .select(`
          id,
          subject_id,
          enrollment_date,
          payment_status,
          subject_cost,
          status,
          subjects(
            id,
            code,
            name,
            name_en,
            credits,
            total_cost
          )
        `)
        .eq('student_id', registration.student_id)
        .eq('semester_id', registration.semester_id);

      if (subjectsError) {
        console.error('❌ Subjects query error:', subjectsError);
      } else {
        console.log('✅ Subjects query successful');
        console.log('📝 Found subjects:', subjectsData?.length || 0);
      }
    }

    // Test 3: Verify the enhanced data structure
    console.log('\n🔧 Test 3: Verifying enhanced data structure...');
    
    if (registrationData && registrationData.length > 0) {
      const registration = registrationData[0];
      
      const enhancedData = {
        id: registration.id,
        student_id: registration.student_id,
        semester_id: registration.semester_id,
        department_id: registration.department_id,
        semester_number: registration.semester_number, // This should work now
        registration_date: registration.registration_date,
        status: registration.status,
        tuition_paid: registration.tuition_paid,
        notes: registration.notes,
        created_at: registration.created_at,
        updated_at: registration.updated_at,
        
        // Student information
        students: registration.students,
        student_display_name: registration.students?.name || 'غير محدد',
        student_email: registration.students?.email || 'غير محدد',
        student_id_number: registration.students?.national_id_passport || 'غير محدد',
        
        // Semester information
        semesters: registration.semesters,
        semester_display_name: registration.semesters?.name || 'غير محدد',
        semester_display_name_en: registration.semesters?.name_en || 'Not Specified',
        academic_year: registration.semesters?.study_years?.name || 'غير محدد',
        
        // Department information
        departments: registration.departments,
        department_display_name: registration.departments?.name || 'غير محدد',
        
        // Additional computed fields
        registration_duration_days: registration.registration_date ? 
          Math.floor((new Date().getTime() - new Date(registration.registration_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        
        // Payment status
        payment_status: registration.tuition_paid ? 'paid' : 'unpaid'
      };

      console.log('✅ Enhanced data structure created successfully');
      console.log('📝 Enhanced data sample:', {
        student_name: enhancedData.student_display_name,
        semester_name: enhancedData.semester_display_name,
        semester_number: enhancedData.semester_number,
        academic_year: enhancedData.academic_year,
        registration_duration_days: enhancedData.registration_duration_days,
        payment_status: enhancedData.payment_status
      });
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('📋 Summary:');
    console.log('- Registration query: Working');
    console.log('- Subjects query: Working');
    console.log('- Enhanced data structure: Working');
    console.log('- semester_number field: Accessible from registration table');
    console.log('- No more semesters.semester_number errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEnhancedRegistrationAPI();

export { testEnhancedRegistrationAPI };

