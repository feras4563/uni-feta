# Subject-Department Many-to-Many Relationship Implementation

## Overview
This implementation allows subjects to be associated with multiple departments instead of just one, creating a many-to-many relationship between subjects and departments.

## Database Changes

### 1. New Junction Table: `subject_departments`
```sql
CREATE TABLE subject_departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    is_primary_department BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, department_id)
);
```

### 2. New View: `subjects_with_departments`
This view provides subjects with their associated departments in JSON format for easy frontend consumption.

### 3. Migration Script
Run `subject-departments-migration.sql` to:
- Create the junction table
- Migrate existing data
- Set up proper indexes and RLS policies

## API Changes

### New Functions Added:
- `createSubjectWithDepartments()` - Creates subject with multiple departments
- `updateSubjectDepartments()` - Updates department relationships for existing subjects
- `getSubjectDepartments()` - Gets all departments for a subject

### Updated Functions:
- `fetchSubjects()` - Now uses the `subjects_with_departments` view

## Frontend Changes

### 1. SubjectCreate Component
- **Multi-select interface**: Checkboxes for department selection
- **Primary department selection**: Dropdown to choose primary department when multiple are selected
- **Visual feedback**: Shows selected departments with primary department highlighted
- **Validation**: Ensures at least one department is selected

### 2. StudyMaterialModal Component
- Same multi-select interface as SubjectCreate
- Handles both creating new subjects and editing existing ones
- Maintains backward compatibility with existing data

### 3. Form State Updates
```typescript
const [form, setForm] = useState({
  // ... other fields
  department_ids: [] as string[],
  primary_department_id: "",
  // ... other fields
});
```

## Usage Instructions

### Creating a New Subject with Multiple Departments:
1. Navigate to Subject Creation page
2. Fill in basic subject information (code, name, etc.)
3. **Select Departments**: Check the boxes for all departments this subject belongs to
4. **Choose Primary Department**: If multiple departments are selected, choose which one is primary
5. Complete other fields and submit

### Editing Existing Subject:
1. Open the subject for editing
2. Modify department selections using the same interface
3. The system will automatically update the relationships

### Key Features:
- **Primary Department**: One department can be marked as primary for administrative purposes
- **Visual Indicators**: Selected departments are shown with badges, primary department is highlighted
- **Validation**: System ensures at least one department is always selected
- **Backward Compatibility**: Existing subjects with single departments continue to work

## Data Structure

### Subject Object (from API):
```json
{
  "id": "subject-id",
  "code": "CS101",
  "name": "Programming Fundamentals",
  "departments": [
    {
      "id": "dept-1",
      "name": "Computer Science",
      "is_primary": true,
      "is_active": true
    },
    {
      "id": "dept-2", 
      "name": "Information Technology",
      "is_primary": false,
      "is_active": true
    }
  ],
  "primary_department": {
    "id": "dept-1",
    "name": "Computer Science"
  }
}
```

## Benefits

1. **Flexibility**: Subjects can now serve multiple departments
2. **Cross-departmental Courses**: Common subjects can be shared between departments
3. **Better Organization**: Clear distinction between primary and secondary departments
4. **Scalability**: Easy to add/remove department associations
5. **Backward Compatibility**: Existing functionality remains unchanged

## Migration Notes

- Existing subjects will automatically have their current department set as primary
- No data loss during migration
- All existing queries continue to work through the new view
- RLS policies ensure proper access control

## Future Enhancements

- Department-specific subject requirements
- Department-specific grading scales
- Cross-department enrollment tracking
- Department-specific subject materials


