// Test script to check enrollment API response
// Run this in browser console on the registration page

// Test the enrollment API
async function testEnrollmentAPI() {
  try {
    console.log('🔍 Testing enrollment API...');
    
    // Import the API function (you'll need to adjust this based on your setup)
    const { fetchStudentSubjectEnrollments } = await import('./src/lib/api.ts');
    
    // Test with a specific student ID
    const studentId = 'ST259570';
    console.log('🔍 Fetching enrollments for student:', studentId);
    
    const enrollments = await fetchStudentSubjectEnrollments(studentId);
    console.log('🔍 Raw API response:', enrollments);
    
    // Check the structure
    if (enrollments && enrollments.length > 0) {
      console.log('🔍 First enrollment structure:', enrollments[0]);
      console.log('🔍 Subject ID from first enrollment:', enrollments[0].subject_id);
      console.log('🔍 Subjects object from first enrollment:', enrollments[0].subjects);
    } else {
      console.log('🔍 No enrollments found');
    }
    
    return enrollments;
  } catch (error) {
    console.error('❌ Error testing enrollment API:', error);
  }
}

// Run the test
testEnrollmentAPI();
