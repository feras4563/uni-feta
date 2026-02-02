// ==============================================
// TEST API FUNCTION DIRECTLY
// This script tests the fetchDepartmentCurriculumBySemesterNumber function
// ==============================================

// You can run this in the browser console on your registration page
// to test the API function directly

async function testCurriculumAPI() {
  console.log("🧪 Testing fetchDepartmentCurriculumBySemesterNumber API...");
  
  try {
    // Import the function (you might need to adjust the import path)
    const { fetchDepartmentCurriculumBySemesterNumber } = await import('./src/lib/api.ts');
    
    // Test with DEPT_MANAGEMENT and semester 1
    const departmentId = 'DEPT_MANAGEMENT';
    const semesterNumber = 1;
    
    console.log(`📋 Testing with department: ${departmentId}, semester: ${semesterNumber}`);
    
    const result = await fetchDepartmentCurriculumBySemesterNumber(departmentId, semesterNumber);
    
    console.log("✅ API Result:", result);
    console.log(`📊 Found ${result.length} subjects for semester ${semesterNumber}`);
    
    // Display the subjects
    result.forEach((item, index) => {
      console.log(`${index + 1}. ${item.subjects?.name} (${item.subjects?.code}) - ${item.subjects?.credits} credits - ${item.subjects?.total_cost} دينار`);
    });
    
    return result;
  } catch (error) {
    console.error("❌ Error testing API:", error);
  }
}

// Run the test
testCurriculumAPI();

// Alternative: Test with different semester numbers
async function testAllSemesters() {
  console.log("🧪 Testing all semesters for DEPT_MANAGEMENT...");
  
  const departmentId = 'DEPT_MANAGEMENT';
  
  for (let semester = 1; semester <= 8; semester++) {
    try {
      const { fetchDepartmentCurriculumBySemesterNumber } = await import('./src/lib/api.ts');
      const result = await fetchDepartmentCurriculumBySemesterNumber(departmentId, semester);
      
      console.log(`📋 Semester ${semester}: ${result.length} subjects`);
      if (result.length > 0) {
        result.forEach(item => {
          console.log(`  - ${item.subjects?.name} (${item.subjects?.code})`);
        });
      }
    } catch (error) {
      console.error(`❌ Error testing semester ${semester}:`, error);
    }
  }
}

// Uncomment to test all semesters
// testAllSemesters();







