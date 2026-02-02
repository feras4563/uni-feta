// Test the ID parsing logic
// Run this in browser console

function parseCompositeId(compositeId) {
  if (!compositeId) return null;
  
  // Handle different ID formats
  if (compositeId.includes('-')) {
    // For composite IDs like "ST259570-284963e1-aae3-4b35-a372-89bb5066745f"
    // The student ID is typically at the beginning and semester ID is a UUID at the end
    
    // Try to find a UUID pattern (8-4-4-4-12 characters)
    const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
    const uuidMatch = compositeId.match(uuidPattern);
    
    if (uuidMatch) {
      const semesterId = uuidMatch[1];
      const studentId = compositeId.replace(`-${semesterId}`, '');
      return { studentId, semesterId };
    }
    
    // Fallback: split by the last dash
    const parts = compositeId.split('-');
    if (parts.length >= 2) {
      const studentId = parts.slice(0, -1).join('-');
      const semesterId = parts[parts.length - 1];
      return { studentId, semesterId };
    }
  }
  
  // If no dashes, treat as a single student ID
  return { studentId: compositeId, semesterId: null };
}

// Test with the problematic ID
const testId = "ST259570-284963e1-aae3-4b35-a372-89bb5066745f";
const result = parseCompositeId(testId);

console.log('🔍 ID Parsing Test:');
console.log('Input:', testId);
console.log('Output:', result);

// Expected:
// {
//   studentId: "ST259570",
//   semesterId: "284963e1-aae3-4b35-a372-89bb5066745f"
// }

// Test with other formats
const testCases = [
  "ST259570-284963e1-aae3-4b35-a372-89bb5066745f",
  "ST259570",
  "simple-id",
  "complex-uuid-123e4567-e89b-12d3-a456-426614174000"
];

testCases.forEach(testCase => {
  const result = parseCompositeId(testCase);
  console.log(`Test: "${testCase}" ->`, result);
});
