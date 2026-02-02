# Fix Subjects Not Showing Issue

## Problem
The student "تجربة" with department "feras" and semester 1 shows "لا توجد مقررات" (No subjects) because there are no subjects configured for this department and semester combination.

## Root Cause
The `fetchDepartmentCurriculumBySemesterNumber` API function queries the `department_semester_subjects` table, but there are no entries for:
- Department ID: "feras" 
- Semester Number: 1

## Solution Steps

### Step 1: Run the Database Fix
Execute the SQL script `create-feras-subjects.sql` in your Supabase SQL Editor. This will:

1. Ensure the "feras" department exists
2. Create 5 sample subjects for semester 1:
   - FER101 - مقدمة في علوم الحاسوب (Introduction to Computer Science)
   - FER102 - البرمجة الأساسية (Basic Programming) 
   - FER103 - الرياضيات التطبيقية (Applied Mathematics)
   - FER104 - اللغة الإنجليزية التقنية (Technical English)
   - FER105 - أساسيات قواعد البيانات (Database Fundamentals)
3. Create entries in the `department_semester_subjects` table linking these subjects to the "feras" department and semester 1

### Step 2: Verify the Fix
After running the SQL script, refresh the student registration page and:
1. Select the student "تجربة"
2. Choose "الفصل الدراسي 1" (Semester 1)
3. You should now see 5 subjects listed with their costs

### Step 3: Test Registration
Try registering the student in some subjects to ensure the full workflow works.

## Alternative Solutions

If you want to use different subjects or departments:

1. **Use existing departments**: Change the student's department_id to an existing department that has subjects (like "DEPT_MANAGEMENT")

2. **Create subjects for other departments**: Use the department management interface to add subjects to any department

3. **Use the subject creation interface**: Go to Subjects → Create Subject to add new subjects and assign them to departments

## Technical Details

The issue occurs in the `fetchDepartmentCurriculumBySemesterNumber` function in `src/lib/api.ts` (lines 2272-2327), which queries:

```sql
SELECT ... FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
WHERE dss.department_id = 'feras'
AND dss.semester_number = 1
AND dss.is_active = true
```

When no matching records exist in `department_semester_subjects`, the query returns an empty result, causing the "لا توجد مقررات" message to display.


