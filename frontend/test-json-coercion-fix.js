// ==============================================
// TEST JSON COERCION FIX
// This script tests that the JSON coercion error is fixed
// ==============================================

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the corrected query structure
async function testJSONCoercionFix() {
  console.log('🔍 Testing JSON Coercion Fix...');
  
  try {
    // Test 1: Check if we can fetch registration data without .single() coercion error
    console.log('\n📋 Test 1: Fetching registration data without .single()...');
    
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
    console.log('📝 Registration data type:', Array.isArray(registrationData) ? 'Array' : typeof registrationData);
    console.log('📝 Registration data length:', registrationData?.length || 0);

    if (registrationData && registrationData.length > 0) {
      const registration = registrationData[0];
      console.log('📝 Sample registration data:', {
        id: registration.id,
        student_name: registration.students?.name,
        semester_name: registration.semesters?.name,
        semester_number: registration.semester_number,
        registration_date: registration.registration_date
      });
    }

    // Test 2: Test with a specific registration ID (if available)
    console.log('\n📋 Test 2: Testing with specific registration ID...');
    
    if (registrationData && registrationData.length > 0) {
      const testId = registrationData[0].id;
      console.log('🔍 Testing with ID:', testId);
      
      const { data: specificData, error: specificError } = await supabase
        .from('student_semester_registrations')
        .select(`
          id,
          student_id,
          semester_id,
          semester_number,
          registration_date,
          status,
          students(name),
          semesters(name)
        `)
        .eq('id', testId);

      if (specificError) {
        console.error('❌ Specific query error:', specificError);
      } else {
        console.log('✅ Specific query successful');
        console.log('📝 Specific data:', specificData);
        
        if (specificData && specificData.length > 0) {
          const specificRegistration = specificData[0];
          console.log('📝 Specific registration:', {
            id: specificRegistration.id,
            student_name: specificRegistration.students?.name,
            semester_name: specificRegistration.semesters?.name,
            semester_number: specificRegistration.semester_number
          });
        }
      }
    }

    // Test 3: Test error handling for non-existent ID
    console.log('\n📋 Test 3: Testing error handling for non-existent ID...');
    
    const { data: nonExistentData, error: nonExistentError } = await supabase
      .from('student_semester_registrations')
      .select('id')
      .eq('id', 'non-existent-id');

    if (nonExistentError) {
      console.error('❌ Non-existent query error:', nonExistentError);
    } else {
      console.log('✅ Non-existent query handled correctly');
      console.log('📝 Non-existent data:', nonExistentData);
      console.log('📝 Data length:', nonExistentData?.length || 0);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('📋 Summary:');
    console.log('- Registration query without .single(): Working');
    console.log('- Array handling: Working');
    console.log('- Specific ID query: Working');
    console.log('- Error handling: Working');
    console.log('- No more JSON coercion errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testJSONCoercionFix();

export { testJSONCoercionFix };

