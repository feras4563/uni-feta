# University ERP API Documentation

## Base URL
```
http://localhost:8000/api
```

## API Endpoints

### Students API

#### Get All Students
```http
GET /api/students
```

Query Parameters:
- `search` - Search by name, email, or national ID
- `department_id` - Filter by department
- `status` - Filter by status (active, inactive, graduated, suspended)
- `year` - Filter by year
- `order_by` - Order by field (default: created_at)
- `order_dir` - Order direction (asc, desc)
- `per_page` - Items per page (default: 15)
- `paginate` - Set to 'false' to get all results without pagination

Example:
```http
GET /api/students?search=john&status=active&department_id=123
```

#### Get Single Student
```http
GET /api/students/{id}
```

Returns student with related data (department, registrations, grades, attendance, academic progress)

#### Create Student
```http
POST /api/students
Content-Type: application/json

{
  "name": "أحمد محمد",
  "name_en": "Ahmed Mohammed",
  "email": "ahmed@example.com",
  "national_id_passport": "1234567890",
  "phone": "+966501234567",
  "department_id": "dept-uuid",
  "year": 1,
  "status": "active",
  "gender": "male",
  "nationality": "سعودي",
  "birth_date": "2000-01-01",
  "enrollment_date": "2024-09-01"
}
```

#### Update Student
```http
PUT /api/students/{id}
Content-Type: application/json

{
  "name": "أحمد محمد علي",
  "status": "active"
}
```

#### Delete Student
```http
DELETE /api/students/{id}
```

#### Get Student Statistics
```http
GET /api/students/statistics
```

Returns counts by status, year, and department

---

### Departments API

#### Get All Departments
```http
GET /api/departments
```

Query Parameters:
- `is_active` - Filter by active status (true/false)
- `search` - Search by name

#### Get Department Details
```http
GET /api/departments/{id}/details
```

Returns department with subjects grouped by semester, student counts, and statistics

#### Create Department
```http
POST /api/departments
Content-Type: application/json

{
  "name": "علوم الحاسب",
  "name_en": "Computer Science",
  "description": "Department description",
  "head": "Dr. Ahmed",
  "head_teacher_id": "teacher-uuid",
  "is_active": true
}
```

#### Update Department
```http
PUT /api/departments/{id}
```

#### Delete Department
```http
DELETE /api/departments/{id}
```

#### Get Department Statistics
```http
GET /api/departments/{id}/statistics
```

---

### Subjects API

#### Get All Subjects
```http
GET /api/subjects
```

Query Parameters:
- `search` - Search by name, code, or description
- `department_id` - Filter by department
- `semester_number` - Filter by semester
- `is_required` - Filter by required status
- `is_active` - Filter by active status

#### Get Subjects by Department
```http
GET /api/subjects/department/{departmentId}
```

#### Get Subjects by Semester
```http
GET /api/subjects/semester/{semesterNumber}
```

#### Create Subject
```http
POST /api/subjects
Content-Type: application/json

{
  "name": "برمجة 1",
  "name_en": "Programming 1",
  "code": "CS101",
  "description": "Introduction to programming",
  "credits": 3,
  "department_id": "dept-uuid",
  "cost_per_credit": 500.00,
  "is_required": true,
  "semester_number": 1,
  "max_students": 30,
  "is_active": true
}
```

#### Update Subject
```http
PUT /api/subjects/{id}
```

#### Delete Subject
```http
DELETE /api/subjects/{id}
```

---

### Teachers API

#### Get All Teachers
```http
GET /api/teachers
```

Query Parameters:
- `is_active` - Filter by active status
- `search` - Search by name, email, phone, or specialization
- `department_id` - Filter by department

#### Get Teacher Details
```http
GET /api/teachers/{id}
```

Returns teacher with subjects, assignments, and recent sessions

#### Create Teacher
```http
POST /api/teachers
Content-Type: application/json

{
  "name": "د. أحمد محمد",
  "name_en": "Dr. Ahmed Mohammed",
  "email": "ahmed.teacher@example.com",
  "phone": "+966501234567",
  "specialization": "Computer Science",
  "department_id": "dept-uuid",
  "username": "ahmed.mohammed",
  "password": "secure_password",
  "is_active": true
}
```

#### Update Teacher
```http
PUT /api/teachers/{id}
```

#### Get Teacher's Subjects
```http
GET /api/teachers/{id}/subjects
```

#### Get Teacher's Sessions
```http
GET /api/teachers/{id}/sessions
```

Query Parameters:
- `status` - Filter by session status
- `start_date` - Filter from date
- `end_date` - Filter to date

#### Get Teacher Statistics
```http
GET /api/teachers/{id}/statistics
```

---

### Study Years API

#### Get All Study Years
```http
GET /api/study-years
```

#### Get Current Study Year
```http
GET /api/study-years/current
```

#### Create Study Year
```http
POST /api/study-years
Content-Type: application/json

{
  "name": "2024-2025",
  "name_en": "2024-2025",
  "start_date": "2024-09-01",
  "end_date": "2025-06-30",
  "is_current": true,
  "is_active": true,
  "description": "العام الدراسي 2024-2025"
}
```

---

### Semesters API

#### Get All Semesters
```http
GET /api/semesters
```

Query Parameters:
- `study_year_id` - Filter by study year
- `is_current` - Filter by current semester

#### Get Current Semester
```http
GET /api/semesters/current
```

#### Create Semester
```http
POST /api/semesters
Content-Type: application/json

{
  "name": "الفصل الأول",
  "name_en": "Fall Semester",
  "code": "F24",
  "study_year_id": "year-uuid",
  "start_date": "2024-09-01",
  "end_date": "2024-12-31",
  "is_current": true,
  "is_active": true
}
```

---

### Attendance API

#### Get Attendance Records
```http
GET /api/attendance
```

Query Parameters:
- `session_id` - Filter by session
- `student_id` - Filter by student
- `status` - Filter by status (present, late, absent, excused)

#### Get Attendance by Session
```http
GET /api/attendance/session/{sessionId}
```

#### Get Attendance by Student
```http
GET /api/attendance/student/{studentId}
```

#### Get Session Attendance Statistics
```http
GET /api/attendance/session/{sessionId}/statistics
```

#### Record Attendance
```http
POST /api/attendance
Content-Type: application/json

{
  "session_id": "session-uuid",
  "student_id": "student-uuid",
  "status": "present",
  "student_qr_code": "qr-data",
  "is_manual_entry": false
}
```

---

### Grades API

#### Get All Grades
```http
GET /api/grades
```

Query Parameters:
- `student_id` - Filter by student
- `subject_id` - Filter by subject
- `teacher_id` - Filter by teacher
- `grade_type` - Filter by type (midterm, final, assignment, quiz, project, participation, homework)
- `is_published` - Filter by published status

#### Get Student Grades
```http
GET /api/grades/student/{studentId}
```

#### Get Subject Grades
```http
GET /api/grades/subject/{subjectId}
```

#### Get Student's Grades for Specific Subject
```http
GET /api/grades/student/{studentId}/subject/{subjectId}
```

Returns grades with average and total

#### Create Grade
```http
POST /api/grades
Content-Type: application/json

{
  "student_id": "student-uuid",
  "subject_id": "subject-uuid",
  "teacher_id": "teacher-uuid",
  "grade_type": "midterm",
  "grade_name": "Midterm Exam 1",
  "grade_value": 85.5,
  "max_grade": 100,
  "weight": 0.3,
  "grade_date": "2024-10-15",
  "description": "First midterm examination",
  "feedback": "Good performance",
  "is_published": true
}
```

---

## Response Format

### Success Response
```json
{
  "id": "uuid",
  "name": "Student Name",
  "email": "student@example.com",
  ...
}
```

### Paginated Response
```json
{
  "current_page": 1,
  "data": [...],
  "first_page_url": "http://localhost:8000/api/students?page=1",
  "from": 1,
  "last_page": 5,
  "last_page_url": "http://localhost:8000/api/students?page=5",
  "next_page_url": "http://localhost:8000/api/students?page=2",
  "path": "http://localhost:8000/api/students",
  "per_page": 15,
  "prev_page_url": null,
  "to": 15,
  "total": 75
}
```

### Error Response
```json
{
  "errors": {
    "email": ["The email has already been taken."],
    "name": ["The name field is required."]
  }
}
```

## HTTP Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `422 Unprocessable Entity` - Validation errors
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Notes

- All dates are in ISO 8601 format
- All endpoints support both `PUT` and `PATCH` for updates
- UUIDs are used as primary keys
- Relationships are eager loaded where appropriate
- CORS is enabled for all origins (configure in production)
