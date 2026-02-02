# Schema Sequence Fix

## ❌ **Issue Identified**

The SQL schema was failing with the error:
```
ERROR: 42P01: relation "student_id_seq" does not exist
```

This happened because the `CREATE TABLE students` statement was trying to reference `student_id_seq` sequence before it was created.

## ✅ **Fix Applied**

### **Problem**
```sql
-- ❌ This was failing because sequence didn't exist yet
CREATE TABLE students (
  id TEXT PRIMARY KEY DEFAULT 'ST' || LPAD(nextval('student_id_seq')::TEXT, 6, '0'),
  ...
);

-- Sequence was created AFTER the table
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 100000;
```

### **Solution**
```sql
-- ✅ Create sequences FIRST
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 100000;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 100000;

-- ✅ Then create tables that reference them
CREATE TABLE students (
  id TEXT PRIMARY KEY DEFAULT 'ST' || LPAD(nextval('student_id_seq')::TEXT, 6, '0'),
  ...
);
```

## 🔧 **Changes Made**

1. **Moved sequence creation** to the beginning of the schema
2. **Updated section numbers** throughout the file
3. **Removed duplicate** sequence creation
4. **Ensured proper order** of dependencies

## 🎯 **Result**

The schema now executes in the correct order:
1. Drop existing tables
2. **Create sequences first**
3. Create core tables (that reference sequences)
4. Create registration tables
5. Create indexes
6. Create triggers
7. Create RLS policies
8. Create views

The schema should now execute successfully without sequence errors! 🚀

