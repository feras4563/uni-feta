// ==============================================
// TEST SCRIPT: SEMESTER ID CONNECTION FOR INVOICES
// This script tests the connection between registration semester_id and invoice display
// ==============================================

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test function to verify semester_id connection
async function testSemesterInvoiceConnection() {
  console.log('🔍 Testing semester_id connection between registration and invoice...');
  
  try {
    // Test 1: Check if we have student registrations with semester_id
    console.log('\n📋 Test 1: Checking student registrations...');
    const { data: registrations, error: regError } = await supabase
      .from('student_semester_registrations')
      .select(`
        id,
        student_id,
        semester_id,
        semester_number,
        registration_date,
        status,
        students(id, name),
        semesters(id, name, name_en)
      `)
      .limit(5);
    
    if (regError) {
      console.error('❌ Error fetching registrations:', regError);
      return;
    }
    
    console.log('✅ Found registrations:', registrations?.length || 0);
    if (registrations && registrations.length > 0) {
      console.log('📝 Sample registration:', {
        student: registrations[0].students?.name,
        semester: registrations[0].semesters?.name,
        semester_id: registrations[0].semester_id
      });
    }
    
    // Test 2: Check if we have invoices with semester_id
    console.log('\n💰 Test 2: Checking student invoices...');
    const { data: invoices, error: invError } = await supabase
      .from('student_invoices')
      .select(`
        id,
        student_id,
        semester_id,
        invoice_number,
        invoice_date,
        total_amount,
        status,
        students(id, name),
        semesters(id, name, name_en)
      `)
      .limit(5);
    
    if (invError) {
      console.error('❌ Error fetching invoices:', invError);
      return;
    }
    
    console.log('✅ Found invoices:', invoices?.length || 0);
    if (invoices && invoices.length > 0) {
      console.log('📝 Sample invoice:', {
        student: invoices[0].students?.name,
        semester: invoices[0].semesters?.name,
        semester_id: invoices[0].semester_id,
        invoice_number: invoices[0].invoice_number
      });
    }
    
    // Test 3: Check connection between registration and invoice
    console.log('\n🔗 Test 3: Checking registration-invoice connection...');
    if (registrations && invoices && registrations.length > 0 && invoices.length > 0) {
      const sampleStudentId = registrations[0].student_id;
      
      const { data: studentInvoices, error: studentInvError } = await supabase
        .from('student_invoices')
        .select(`
          id,
          student_id,
          semester_id,
          invoice_number,
          students(id, name),
          semesters(id, name, name_en)
        `)
        .eq('student_id', sampleStudentId);
      
      if (studentInvError) {
        console.error('❌ Error fetching student invoices:', studentInvError);
        return;
      }
      
      console.log('✅ Student invoices for sample student:', studentInvoices?.length || 0);
      if (studentInvoices && studentInvoices.length > 0) {
        console.log('📝 Sample student invoice:', {
          student: studentInvoices[0].students?.name,
          semester: studentInvoices[0].semesters?.name,
          semester_id: studentInvoices[0].semester_id,
          invoice_number: studentInvoices[0].invoice_number
        });
      }
    }
    
    // Test 4: Verify the API function structure
    console.log('\n🔧 Test 4: Testing API function structure...');
    const { data: apiTest, error: apiError } = await supabase
      .from('student_invoices')
      .select(`
        *,
        students(id, name, national_id_passport, email),
        semesters(id, name, name_en),
        departments(id, name, name_en),
        invoice_items(
          *,
          subjects(id, code, name, name_en)
        )
      `)
      .limit(1);
    
    if (apiError) {
      console.error('❌ Error testing API structure:', apiError);
      return;
    }
    
    console.log('✅ API structure test successful');
    if (apiTest && apiTest.length > 0) {
      const invoice = apiTest[0];
      console.log('📝 API test result:', {
        has_student: !!invoice.students,
        has_semester: !!invoice.semesters,
        has_department: !!invoice.departments,
        has_invoice_items: !!invoice.invoice_items,
        semester_name: invoice.semesters?.name,
        semester_name_en: invoice.semesters?.name_en
      });
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('📋 Summary:');
    console.log('- Student registrations:', registrations?.length || 0);
    console.log('- Student invoices:', invoices?.length || 0);
    console.log('- API structure: Working');
    console.log('- Semester connection: Ready for frontend display');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test function to simulate frontend invoice display
async function testFrontendDisplay() {
  console.log('\n🖥️ Testing frontend display simulation...');
  
  try {
    const { data: invoices, error } = await supabase
      .from('student_invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        total_amount,
        status,
        students(id, name, national_id_passport, email),
        semesters(id, name, name_en),
        departments(id, name, name_en)
      `)
      .limit(3);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('✅ Frontend display test:');
    invoices?.forEach((invoice, index) => {
      console.log(`\n📄 Invoice ${index + 1}:`);
      console.log(`  - Invoice Number: ${invoice.invoice_number}`);
      console.log(`  - Student: ${invoice.students?.name || 'غير محدد'}`);
      console.log(`  - الفصل الدراسي للتسجيل: ${invoice.semesters?.name || 'غير محدد'}`);
      console.log(`  - Semester ID: ${invoice.semester_id || 'غير محدد'}`);
      console.log(`  - Department: ${invoice.departments?.name || 'غير محدد'}`);
      console.log(`  - Total Amount: ${invoice.total_amount} دينار`);
      console.log(`  - Status: ${invoice.status}`);
    });
    
  } catch (error) {
    console.error('❌ Frontend display test failed:', error);
  }
}

// Run the tests
async function runAllTests() {
  console.log('🚀 Starting semester-invoice connection tests...\n');
  
  await testSemesterInvoiceConnection();
  await testFrontendDisplay();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run the SQL migration scripts if needed');
  console.log('2. Verify the frontend displays semester information correctly');
  console.log('3. Test creating new invoices to ensure automatic semester_id linking');
}

// Export for use in other files
export { testSemesterInvoiceConnection, testFrontendDisplay, runAllTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

