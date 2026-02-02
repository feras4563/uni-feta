# Diagnose Enrollment Issue

## Current Problem
The subjects are still selectable because there are no enrollment records in the database for the student.

## Root Cause
Looking at the database results, we can see:
- ✅ **Subjects exist**: test3, 001, test2 are available
- ❌ **No enrollments**: The `student_subject_enrollments` table is likely empty
- ❌ **No test data**: No student has been enrolled in any subjects yet

## Solution Steps

### Step 1: Check Current State
Run this in Supabase SQL Editor:
```sql
-- Check if there are any enrollments
SELECT COUNT(*) FROM student_subject_enrollments;

-- Check enrollments for ST259570
SELECT * FROM student_subject_enrollments WHERE student_id = 'ST259570';
```

### Step 2: Create Test Data
Run `create-test-enrollments.sql` to create test enrollment data.

### Step 3: Test the UI
1. Go to the registration page
2. Select student ST259570
3. Choose a semester
4. You should now see some subjects marked as enrolled (green, uncheckable)

## Expected Results After Fix

**Before (Current State):**
- All subjects show checkboxes
- All subjects are selectable
- Summary shows "مسجل مسبقاً: 0 مقرر"

**After (With Test Data):**
- Some subjects show green background with checkmark
- Enrolled subjects are uncheckable
- Summary shows "مسجل مسبقاً: X مقرر" (where X > 0)

## Alternative: Manual Test
If you want to test manually:
1. Register a student in some subjects first
2. Then try to register the same student again
3. The previously enrolled subjects should be uncheckable

## Debug Console
Check browser console for these logs:
```
🔍 Raw enrollments data: [...]
🔍 Extracted enrolled subject IDs: [...]
🔍 Subject check: { subjectId: "...", isEnrolled: true/false, ... }
```
