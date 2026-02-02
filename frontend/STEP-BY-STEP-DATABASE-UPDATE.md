# Step-by-Step Database Update Guide

## 🚨 **Current Status**
The frontend is still getting 400 errors because the database hasn't been updated with our clean schema.

## 📋 **Step-by-Step Instructions**

### **Step 1: Check Current Database**
Run this in Supabase SQL editor:
```sql
-- File: quick-database-check.sql
```
This will show you what tables and columns currently exist.

### **Step 2: Apply Clean Schema**
Run this in Supabase SQL editor:
```sql
-- File: clean-student-registration-schema.sql
```
This will:
- Drop existing conflicting tables
- Create clean, focused schema
- Add all required columns for frontend compatibility

### **Step 3: Insert Sample Data**
Run this in Supabase SQL editor:
```sql
-- File: sample-student-registration-data.sql
```
This will populate the database with test data.

### **Step 4: Verify Update**
Run this in Supabase SQL editor:
```sql
-- File: check-database-status.sql
```
This will confirm the update was successful.

## 🎯 **Expected Results After Update**

1. **Tables Created**: 8 tables with all required columns
2. **Sample Data**: 10 students, 5 departments, 25 subjects, etc.
3. **Frontend Compatibility**: All columns the frontend expects will be present
4. **No More 400 Errors**: Frontend will load successfully

## 🔍 **What the Frontend Needs**

The frontend is requesting these columns from students table:
- `id`, `name`, `name_en`, `department_id`, `year`, `status`
- `national_id_passport`, `email`, `phone`, `gender`, `nationality`
- `birth_date`, `enrollment_date`, `address`, `sponsor_name`
- `sponsor_contact`, `academic_history`, `academic_score`
- `transcript_file`, `qr_code`, `created_at`, `updated_at`
- `departments(id,name)` - foreign key relationship

## ⚠️ **Important Notes**

- **Order Matters**: Run schema first, then sample data
- **Backup**: Consider backing up current data if needed
- **Test Each Step**: Verify each step works before proceeding

## 🚀 **After Update**

Once the database is updated:
1. Refresh your frontend application
2. Check browser console - no more 400 errors
3. Students and departments pages should load
4. Registration functionality should work

The clean schema will resolve all compatibility issues! 🎉

