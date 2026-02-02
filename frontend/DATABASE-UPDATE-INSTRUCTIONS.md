# Database Update Instructions

## 🚨 **Current Issue**

The frontend is still getting 400 errors because the database hasn't been updated with our new clean schema yet. The frontend is trying to query columns that don't exist in the current database.

## 🔍 **What the Frontend is Requesting**

The frontend is trying to query these columns from the students table:
```
id, name, name_en, department_id, year, status, national_id_passport, email, phone, gender, nationality, birth_date, enrollment_date, address, sponsor_name, sponsor_contact, academic_history, academic_score, transcript_file, qr_code, created_at, updated_at, departments(id,name)
```

## ✅ **Solution Steps**

### **Step 1: Check Current Database Status**
Run this in your Supabase SQL editor:
```sql
-- File: check-database-status.sql
```

### **Step 2: Apply Clean Database Schema**
Run this in your Supabase SQL editor:
```sql
-- File: clean-student-registration-schema.sql
```

### **Step 3: Insert Sample Data**
Run this in your Supabase SQL editor:
```sql
-- File: sample-student-registration-data.sql
```

### **Step 4: Test Database Structure**
Run this in your Supabase SQL editor:
```sql
-- File: test-database-structure.sql
```

## 🎯 **Expected Results**

After running the schema and sample data:

1. **Tables Created**: 8 tables (students, departments, study_years, semesters, subjects, student_semester_registrations, student_subject_enrollments, student_invoices)

2. **Sample Data**: 
   - 5 departments
   - 10 students
   - 5 semesters
   - 25 subjects
   - 10 registrations
   - 20 enrollments
   - 10 invoices

3. **Frontend Compatibility**: All required columns should be present

## 🔧 **Troubleshooting**

### **If you get errors:**

1. **Sequence errors**: Make sure sequences are created before tables
2. **Foreign key errors**: Make sure referenced tables exist first
3. **Column errors**: Make sure all required columns are present

### **If frontend still shows 400 errors:**

1. **Check RLS policies**: Make sure RLS is properly configured
2. **Check API permissions**: Make sure authenticated users can access tables
3. **Clear browser cache**: Refresh the page completely

## 🚀 **Verification**

After updating the database, you should see:
- ✅ No 400 errors in browser console
- ✅ Students page loads with data
- ✅ Departments page loads with data
- ✅ Registration functionality works

## 📝 **Important Notes**

- **Backup**: Consider backing up your current data before applying the clean schema
- **Order**: Run the files in the correct order (schema first, then data)
- **Testing**: Test each step before proceeding to the next

The clean database schema will resolve all the frontend compatibility issues! 🎉

