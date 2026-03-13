# University Management System — Architecture

## Overview

A full-stack university management system for **University of Alkhalil** (جامعة الخليل الأهلية). The application manages students, teachers, departments, subjects, timetables, date-specific class sessions, holidays, attendance, grades, and a full double-entry accounting system.

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Laravel 12 (PHP 8.2+) REST API
- **Auth:** JWT (via `php-open-source-saver/jwt-auth`)
- **Database:** MySQL/MariaDB (via Laravel migrations)
- **UI Direction:** RTL (Arabic-first interface)

---

## Project Structure

```
uni-feta/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # 28 API controllers
│   │   ├── Models/                 # 35 Eloquent models
│   │   └── Providers/
│   ├── config/
│   ├── database/
│   │   ├── migrations/             # 49 migration files
│   │   ├── seeders/
│   │   └── factories/
│   ├── routes/
│   │   └── api.php                 # All API route definitions
│   ├── .env.example
│   └── composer.json
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── App.tsx                 # Main router + layout + navigation
│   │   ├── main.tsx                # Entry point
│   │   ├── assets/                 # Logo images
│   │   ├── components/             # Reusable UI components
│   │   │   ├── auth/               # LoginPage, RegisterPage, ProtectedRoute
│   │   │   ├── scheduling/         # ScheduleGrid, AutoGenerateWizard, ResourceOverview
│   │   │   ├── students/           # StudentQRModal
│   │   │   ├── subject/            # SubjectTeachersModal
│   │   │   ├── teacher/            # TeacherSubjectModal, QRDisplay
│   │   │   ├── timetable/          # TimetableEntryEditModal
│   │   │   ├── receipts/           # Receipt components
│   │   │   └── ui/                 # Shared UI primitives (Modal, LoadingSpinner, etc.)
│   │   ├── contexts/
│   │   │   └── JWTAuthContext.tsx   # Auth provider + useAuth hook
│   │   ├── hooks/
│   │   │   ├── usePermissions.ts   # Role-based permission checks
│   │   │   └── useSystemSettings.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts       # APIClient class (fetch wrapper with JWT)
│   │   │   ├── api.ts              # Re-exports jwt-api (backward compat)
│   │   │   ├── jwt-api.ts          # All API endpoint functions (~800 lines)
│   │   │   ├── jwt-auth.ts         # Auth functions, token mgmt, permissions
│   │   │   ├── qr-service.ts       # QR code generation/scanning
│   │   │   └── utils.ts            # cn() helper (clsx + tailwind-merge)
│   │   ├── pages/                  # ~40 page components
│   │   │   ├── finance/            # 11 finance sub-pages
│   │   │   ├── teacher/            # 3 teacher portal pages
│   │   │   └── settings/           # SystemSettings
│   │   └── types/
│   │       └── auth.ts             # AppUser, AuthState, Permission types
│   ├── package.json
│   └── vite.config.ts
│
└── ARCHITECTURE.md             # This file
```

---

## Authentication & Authorization

### JWT Flow
1. User submits email/password to `POST /api/auth/login`
2. Backend validates credentials, returns `access_token` + user data
3. Frontend stores token in `localStorage` (`jwt_token` key)
4. All subsequent API requests include `Authorization: Bearer <token>` header
5. On 401 response, token is cleared and user is redirected to `/login`

### Key Files
| File | Purpose |
|------|---------|
| `frontend/src/lib/jwt-auth.ts` | Token management, `signIn()`, `signOut()`, `getCurrentUser()`, permission matrix |
| `frontend/src/contexts/JWTAuthContext.tsx` | React context provider, `useAuth()` hook |
| `frontend/src/lib/api-client.ts` | `APIClient` class — auto-attaches JWT to all requests |
| `frontend/src/components/auth/ProtectedRoute.tsx` | Route guard with role/resource/action checks |
| `frontend/src/hooks/usePermissions.ts` | `usePermissions()` hook for component-level access control |
| `backend/app/Http/Controllers/Api/AuthController.php` | Login, logout, refresh, me, changePassword |

### User Roles & Permissions

Four roles: **manager**, **staff**, **teacher**, **student**

| Resource | Manager | Staff | Teacher | Student |
|----------|---------|-------|---------|---------|
| students | CRUD | view, create | view | — |
| teachers | CRUD | view | — | — |
| departments | CRUD | view | view | — |
| subjects | CRUD | view, create | view | view (self portal) |
| fees | CRUD | view, create | — | view (self portal) |
| finance | CRUD | — | — | — |
| attendance | CRUD | — | view, create, edit | view (self portal) |
| grades | CRUD | — | CRUD | view (published, self portal) |
| sessions | CRUD | — | CRUD | — |
| holidays | view, create, delete, sync | — | — | — |
| schedule | CRUD | — | view, edit | view (self portal) |
| settings | CRUD | — | — | — |

The `manager` role has full access to everything. Permission checks happen both client-side (via `hasClientPermission()`) and server-side (via middleware).

---

## Database Schema

### Core Academic Tables
| Table | Model | Description |
|-------|-------|-------------|
| `departments` | Department | Academic departments/programs |
| `subjects` | Subject | Course/subject definitions |
| `subject_departments` | SubjectDepartment | Many-to-many: subjects ↔ departments |
| `department_semester_subjects` | DepartmentSemesterSubject | Curriculum: which subjects in which semester per department |
| `subject_titles` | SubjectTitle | Reusable subject name templates |
| `study_years` | StudyYear | Academic years (e.g., 2024-2025) |
| `semesters` | Semester | Semester periods within study years (`status`: registration_open/in_progress/grade_entry/finalized, `finalized_at`, `finalized_by`) |

### People
| Table | Model | Description |
|-------|-------|-------------|
| `users` | User | Laravel auth users (email/password) |
| `app_users` | AppUser | Application-level user profiles (role, status) |
| `students` | Student | Student records (name, department, campus_id, photo) |
| `teachers` | Teacher | Teacher records (name, specialization, campus_id, photo) |

### Enrollment & Registration
| Table | Model | Description |
|-------|-------|-------------|
| `student_semester_registrations` | StudentSemesterRegistration | Student registration per semester |
| `student_subject_enrollments` | StudentSubjectEnrollment | Student enrolled in specific subjects (`is_retake`, `original_enrollment_id` for retake tracking) |
| `student_groups` | StudentGroup | Groups of students for scheduling |
| `student_academic_progress` | StudentAcademicProgress | Academic progress tracking (`academic_standing`, `progression_notes`, `last_evaluated_at`) |

### Scheduling & Timetable
| Table | Model | Description |
|-------|-------|-------------|
| `teacher_subjects` | TeacherSubject | Teacher-to-subject assignments per semester |
| `rooms` | Room | Physical classrooms/labs |
| `time_slots` | TimeSlot | Available time periods |
| `timetable_entries` | TimetableEntry | Scheduled classes (group + subject + teacher + room + time) |
| `class_schedules` | ClassSchedule | Teacher availability schedules |
| `class_sessions` | ClassSession | Individual class session instances (date-specific, linked to `timetable_id` when generated) |
| `holidays` | Holiday | Holiday ranges used to block session generation |

### Attendance & Grades
| Table | Model | Description |
|-------|-------|-------------|
| `attendance_records` | AttendanceRecord | Per-session attendance (`marked_by_id`, `is_override` for manager override tracking) |
| `student_grades` | StudentGrade | Student grades per subject (semester_id, is_published, composite indexes for portal queries) |

### Finance & Accounting
| Table | Model | Description |
|-------|-------|-------------|
| `accounts` | Account | Chart of accounts (hierarchical, supports tree view) |
| `journal_entries` | JournalEntry | Double-entry journal entries |
| `journal_entry_lines` | JournalEntryLine | Debit/credit lines per journal entry |
| `account_defaults` | AccountDefault | Default accounts for automated postings |
| `student_invoices` | StudentInvoice | Invoices generated for students |
| `student_invoice_items` | StudentInvoiceItem | Line items per invoice |
| `payment_modes` | PaymentMode | Payment methods (cash, bank, etc.) |
| `payment_entries` | PaymentEntry | Recorded payments against invoices |

### Transfers
| Table | Model | Description |
|-------|-------|-------------|
| `department_transfers` | DepartmentTransfer | Student department transfer requests with audit trail (`status`, `credits_transferred`, `transferred_subjects` JSON) |

### Notifications
| Table | Model | Description |
|-------|-------|-------------|
| `notifications` | Notification | In-app notifications per user (`type`, `title`, `body`, `icon`, `link`, `data` JSON, `is_read`) |

### System
| Table | Model | Description |
|-------|-------|-------------|
| `permissions` | Permission | Permission definitions |
| `user_actions_log` | UserActionLog | Audit trail |
| `system_settings` | SystemSettings | App-wide configuration (name, logo, etc.) |

---

## API Endpoints

All endpoints are prefixed with `/api`. Protected routes require JWT auth.

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login |
| POST | `/auth/register` | Register |
| GET | `/health` | Health check |
| GET | `/system-settings` | App settings (for initialization) |
| GET | `/time-slots` | Time slot list |

### Auth (Protected)
| Method | Endpoint | Controller |
|--------|----------|------------|
| POST | `/auth/logout` | AuthController |
| POST | `/auth/refresh` | AuthController |
| GET | `/auth/me` | AuthController |
| POST | `/auth/change-password` | AuthController |
| PUT | `/auth/profile` | AuthController |

### CRUD Resources (Protected)
Each resource follows standard REST patterns: `GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`

| Prefix | Controller | Extra Endpoints |
|--------|------------|-----------------|
| `/students` | StudentController | `/statistics`, `/count-by-department`, `/{id}/enrollments`, `/{id}/subject-enrollments`, `/{id}/invoices`, `/{id}/enroll-subjects`, `/{id}/upload-photo` |
| `/departments` | DepartmentController | `/{id}/details`, `/{id}/statistics`, `/{id}/semesters/{n}/subjects` |
| `/subjects` | SubjectController | `/department/{id}`, `/semester/{n}`, `/{id}/check-prerequisites` |
| `/teachers` | TeacherController | `/with-departments`, `/{id}/subjects`, `/{id}/sessions`, `/{id}/statistics`, `/{id}/upload-photo` |
| `/study-years` | StudyYearController | `/current`, `/set-current` |
| `/semesters` | SemesterController | `/current`, `/set-current`, `/{id}/transition-status`, `/{id}/registered-students` |
| `/rooms` | RoomController | — |
| `/student-groups` | StudentGroupController | `/create-from-registrations`, `/auto-create`, `/auto-assign`, `/{id}/students`, `/{id}/available-students` |
| `/student-enrollments` | StudentEnrollmentController | `/student/{id}` |
| `/student-registrations` | StudentRegistrationController | `/register` |
| `/teacher-subjects` | TeacherSubjectController | `/all` |
| `/attendance` | AttendanceController | `/sessions`, `/session/{id}`, `/session/{id}/statistics`, `/student/{id}` |
| `/class-sessions` | AttendanceController | `/{id}/generate-qr`, `/{id}/attendance` |
| `/holidays` | HolidayController | `/sync-schedule` (manager-only) |
| `/grades` | GradeController | `/summary`, `/student/{id}`, `/subject/{id}`, `/student/{sid}/subject/{subid}` |
| `/timetable` | TimetableController | `/entries`, `/group/{id}`, `/teacher/{id}`, `/auto-generate`, `/semester/{id}` |
| `/class-schedules` | ClassScheduleController | `/teacher/{id}` |
| `/accounts` | AccountController | `/tree`, `/parent-accounts`, `/general-ledger/summary`, `/{id}/general-ledger` |
| `/journal-entries` | JournalEntryController | `/{id}/post`, `/{id}/cancel` |
| `/account-defaults` | AccountDefaultController | — |
| `/invoices` | StudentInvoiceController | `/all`, `/basic`, `/statistics`, `/{id}/status` |
| `/payment-modes` | PaymentModeController | — |
| `/payment-entries` | PaymentEntryController | — |
| `/fees` | FeeController | `/statistics`, `/{id}/payment`, `/{id}/toggle-attendance` |
| `/academic-progression` | AcademicProgressionController | `/student/{id}/evaluate`, `/student/{id}/promote`, `/student/{id}/retakeable-subjects`, `/student/{id}/enroll-retake`, `/bulk-evaluate`, `/bulk-promote` |
| `/department-transfers` | DepartmentTransferController | `/initiate`, `/{id}/execute`, `/{id}/reject`, `/student/{studentId}` |
| `/notifications` | NotificationController | `/unread-count`, `/mark-read`, `/mark-all-read` |
| `/subject-titles` | SubjectTitleController | — |
| `/system-settings` | SystemSettingsController | `/upload-logo` |

---

## Frontend Pages & Routes

### Admin/Staff Pages
| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | Dashboard | Main dashboard (admin/staff) |
| `/students` | StudentsPage | Student list with search/filter |
| `/students/create` | StudentCreate | Create new student |
| `/students/:id` | StudentDetail | Student profile, enrollments, invoices |
| `/teachers` | TeachersPage | Teacher list |
| `/teachers/create` | TeacherCreate | Create/edit teacher |
| `/teachers/:id` | TeacherDetail | Teacher profile, subjects, schedule |
| `/departments` | DepartmentsPage | Department list |
| `/departments/create` | DepartmentCreate | Create department |
| `/departments/:id` | DepartmentDetail | Department details, curriculum |
| `/departments/:id/edit` | DepartmentEdit | Edit department |
| `/study-materials` | StudyMaterials | Subject/course catalog |
| `/subjects/create` | SubjectCreate | Create subject |
| `/subjects/:id` | SubjectDetail | Subject details, teacher assignments |
| `/study-years` | StudyYears | Academic year management |
| `/semesters` | Semesters | Semester management |
| `/rooms` | Rooms | Room/classroom management |
| `/student-groups` | StudentGroups | Student group management |
| `/student-groups/:id` | StudentGroupDetail | Group details, member management |
| `/student-registrations` | StudentRegistrations | Registration list |
| `/student-registrations/new` | EnhancedStudentRegistration | New registration form |
| `/student-registrations/:id` | StudentRegistrationDetail | Registration details |
| `/timetable` | Timetable | Timetable viewer |
| `/timetable/group/:groupId` | TimetableGroupView | Group-specific timetable |
| `/timetable-generation` | TimetableGeneration | Auto-generate timetables |
| `/teacher-subject-assignment` | TeacherSubjectAssignment | Assign teachers to subjects |
| `/schedule` | SchedulingPage | Scheduling overview (manager only) |
| `/holidays` | HolidayManagement | Holiday calendar + schedule sync (manager only) |
| `/attendance` | Attendance | Attendance management |
| `/grades` | Grades | Grade overview (Tab 1: real per-student per-subject grade summary with stats) + Academic Progression (Tab 2: evaluate, promote, retake enrollment) |
| `/fees` | FeesPage | Fee/invoice management |

### Finance Pages
| Route | Page Component | Description |
|-------|---------------|-------------|
| `/finance` | Finance | Finance dashboard (chart of accounts, journal, ledger) |
| `/finance/accounts/add` | AddAccount | Create account |
| `/finance/accounts/:id` | AccountDetail | Account details + ledger |
| `/finance/accounts/:id/edit` | EditAccount | Edit account |
| `/finance/journal-entry/add` | AddJournalEntry | Create journal entry |
| `/finance/journal-entry/:id` | JournalEntryDetail | View journal entry |
| `/finance/journal-entry/:id/edit` | EditJournalEntry | Edit journal entry |
| `/finance/account-defaults` | CompanyAccountDefaults | Default account mappings |
| `/finance/invoices/:id` | InvoiceDetail | Invoice details |
| `/finance/invoices/:id/print` | InvoicePrintPage | Printable invoice |
| `/finance/payment-modes` | PaymentModes | Payment method list |
| `/finance/payment-modes/create` | PaymentModeCreate | Create/edit payment mode |
| `/finance/payment-entry/create` | PaymentEntryCreate | Record a payment |
| `/finance/payment-entry/:id` | PaymentEntryDetail | Payment details |

### Teacher Portal
| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` (teacher role) | TeacherDashboard | Teacher's main dashboard |
| `/teacher/sessions` | ClassSessions | Today's unique sessions, QR attendance, manager override badges |
| `/teacher/subject-groups` | TeacherSubjectGroups | View assigned subject groups |
| `/teacher/grades` | TeacherGrades | Grade input, overview table, per-student publish/unpublish, bulk publish |
| `/teacher/schedule` | TeacherSchedule | Teacher's weekly timetable + class schedules |

### Student Portal
| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` (student role) | StudentDashboard | Student's main dashboard |
| `/student/subjects` | StudentSubjects | Student enrolled subjects |
| `/student/grades` | StudentGrades | Student grades (published) |
| `/student/fees` | StudentFees | Student invoices and balances |
| `/student/schedule` | StudentSchedule | Student timetable |
| `/student/attendance` | StudentAttendance | Student attendance records |

### Settings Pages
| Route | Page Component | Description |
|-------|---------------|-------------|
| `/settings/system` | SystemSettings | System configuration (manager only) |
| `/settings/profile` | *(placeholder)* | User profile |
| `/settings/notifications` | *(placeholder)* | Notification settings |
| `/settings/backup` | *(placeholder)* | Backup management |
| `/settings/users` | *(placeholder)* | User management |
| `/settings/permissions` | *(placeholder)* | Permission management |

---

## Key Frontend Patterns

### API Layer
Two API modules exist:
- **`api-client.ts`** — Generic `APIClient` class with `get/post/put/patch/delete/upload` methods. Used by `useSystemSettings` and some components directly.
- **`jwt-api.ts`** — Named export functions for every API endpoint (e.g., `fetchStudents()`, `createTeacher()`). Used by most page components.

Both auto-attach the JWT token from localStorage.

### State Management
- **Server state:** TanStack React Query (`@tanstack/react-query`) for data fetching, caching, and invalidation
- **Auth state:** React Context (`JWTAuthContext`)
- **Local state:** React `useState` for forms and UI state

### Styling
- **Tailwind CSS 3.4** with RTL support (`tailwindcss-rtl`)
- **RTL layout** — Arabic-first UI with `space-x-reverse` patterns
- **Icons:** Font Awesome (via CDN) + Lucide React
- **UI primitives:** Custom components in `components/ui/` (Modal, LoadingSpinner, ErrorMessage, etc.)

### QR Code System
- **`qr-service.ts`** — QR generation for student IDs and attendance sessions
- **`QRDisplay` component** — Renders QR codes and provides scanning capability
- Used in teacher portal for session attendance tracking

---

## Backend Patterns

### Controller Structure
All API controllers are in `app/Http/Controllers/Api/` and follow Laravel resource conventions:
- `index()` — List with optional filters
- `store()` — Create
- `show($id)` — Get single
- `update($id)` — Update
- `destroy($id)` — Delete

Many controllers have additional custom methods for statistics, relationships, and bulk operations.

### Model Relationships
Models use Eloquent relationships extensively:
- **Department** → hasMany Subjects (via pivot), hasMany Students
- **Student** → belongsTo Department, hasMany Enrollments, hasMany Invoices, hasMany Grades
- **Teacher** → hasMany TeacherSubjects, hasMany ClassSessions
- **Subject** → belongsToMany Departments, hasMany TeacherSubjects, belongsToMany prerequisite Subjects, belongsToMany dependent Subjects
- **Account** → hierarchical (parent/children), hasMany JournalEntryLines

### Subject Authoring Flow
- **Create subject (`/subjects/create`):** the frontend loads existing subjects and lets the user select prerequisite subjects before saving. The selector highlights likely prerequisite candidates using the new subject's code, Arabic/English name, semester number, and selected departments.
- **Edit subject (`/subjects/:id`):** prerequisite links are editable from the subject detail page using the same selector and recommendation logic.
- **API payloads:** `POST /api/subjects` and `PUT /api/subjects/{id}` accept `department_ids`, `primary_department_id`, and `prerequisite_ids` together with the core subject fields.
- **Validation rules:** prerequisite subjects must already exist, duplicates are rejected, and a subject cannot reference itself as a prerequisite.
- **Persistence:** the backend stores prerequisite links in `subject_prerequisites` and department ownership in `subject_departments` during the same create/update flow.

### Attendance & Session Management
1. Teacher opens "الحصص والحضور" page — calls `GET /api/teacher-portal/my-sessions?date=YYYY-MM-DD`
2. Page shows today's sessions sorted by start_time, each with subject name, room, department, attendance counts (present/total)
3. Teacher clicks a session row → expands inline attendance panel:
   - Calls `GET /api/teacher-portal/sessions/{id}` → returns enrolled students (from `student_subject_enrollments`) merged with existing attendance records
   - Shows stats bar: enrolled, present, late, absent, excused, unmarked
   - Quick "mark all as" buttons + per-student status buttons (present/late/absent/excused) + notes field
4. Teacher clicks "حفظ الحضور" → `POST /api/teacher-portal/sessions/{id}/attendance` with `{ records: [{ student_id, status, notes }] }`
   - Batch-loads existing records (1 query), creates or updates each record
   - Auto-completes session status to `completed` when all enrolled students are marked
5. Teacher can generate QR code for student self-check-in via `POST /api/class-sessions/{id}/generate-qr`
6. Date navigation: prev/next day buttons + date picker + "today" shortcut

#### Teacher Portal Session Routes
- `GET /api/teacher-portal/my-sessions` — teacher's sessions for a date (default: today). Params: `date`, `start_date`, `end_date`, `status`, `subject_id`. Returns sessions with `enrolled_count` and attendance breakdown counts.
- `GET /api/teacher-portal/sessions/{id}` — full session detail with enrolled students and their attendance records (merged list)
- `POST /api/teacher-portal/sessions/{id}/attendance` — batch mark attendance. Body: `{ records: [{ student_id, status, notes? }] }`

#### Manager Override
- **Policy:** `ClassSessionPolicy::markAttendance` — manager can mark/edit attendance for ANY session at any time (no ownership or status check). Teacher can only mark own sessions that are not `completed`.
- **Admin attendance routes:** `POST /api/attendance` (single record), `PUT /api/attendance/{id}` — both check `ClassSessionPolicy::markAttendance`, detect manager role, set `is_override=true` on manager edits
- **Audit fields:** every attendance record stores `marked_by_id` (auth user ID) and `is_override` (boolean). Frontend shows "override" badge on records modified by managers.
- **Manager detection:** `AttendanceController::isManager()` resolves `AppUser.roleModel.name` or `AppUser.role` from JWT auth user

#### Attendance Statuses
- `present` — student attended on time
- `late` — student arrived late
- `absent` — student did not attend
- `excused` — student absent with valid excuse

#### Session Statuses
- `scheduled` — upcoming or current session, attendance can be marked
- `completed` — all students marked, session finalized (teacher cannot re-mark, manager can override)
- `cancelled` — session cancelled (by schedule sync or manual action, no attendance marking allowed)

#### Holidays API
- Manager-only CRUD: `GET/POST/PUT/DELETE /api/holidays`
- `POST /api/holidays/sync-schedule` — triggers `ClassSessionGenerationService::syncForSemester` for current semester
- Supports `is_recurring` holidays (annual) with cross-year date range handling

#### Key Models & Relationships
- `ClassSession` → belongsTo Teacher, Subject, Department, TimetableEntry; hasMany AttendanceRecord
- `AttendanceRecord` → belongsTo ClassSession (via `session()` and `classSession()` aliases), Student, User (markedBy)
- `TimetableEntry` → belongsTo Semester, Department, Subject, Teacher, Room, TimeSlot, StudentGroup

### Department Transfer Flow

**Service:** `app/Services/DepartmentTransferService.php`
**Controller:** `app/Http/Controllers/Api/DepartmentTransferController.php`

1. Manager initiates transfer: `POST /department-transfers/initiate` with `student_id`, `to_department_id`, `reason`
2. Transfer executes in DB transaction: identifies passed credits, drops active enrollments in old dept, clears group assignment, updates student `department_id` + resets `specialization_track`, updates academic progress, records transferred subjects/credits
3. Student receives notification on completion
4. Transfer can be rejected with admin notes

### Notification System

**Service:** `app/Services/NotificationService.php`
**Controller:** `app/Http/Controllers/Api/NotificationController.php`
**Frontend:** `NotificationBell` component in App.tsx header (all roles)

- `notify()`, `notifyMany()`, `notifyRole()`, `notifyStudent()` — send notifications
- `unreadCount()`, `markAsRead()`, `markAllAsRead()` — manage read state
- Auto-polls every 30s from frontend
- **Triggers:** grade published (→ student), department transfer completed (→ student)
- Extensible: any backend service can call `NotificationService::notify()` to send notifications

### Semester Status Lifecycle

Semesters follow a strict status lifecycle: `registration_open` → `in_progress` → `grade_entry` → `finalized`.

- **`Semester` model** defines `STATUS_TRANSITIONS` constant, `canTransitionTo()` validator, `isFinalized()` helper.
- **`POST /semesters/{id}/transition-status`** — validates transition rules, records `finalized_at`/`finalized_by` on finalization.
- **Grade finalization guard:** When a semester is `finalized`:
  - Teachers are blocked (403) from creating/updating grades via `TeacherPortalController` (storeGrades, updateGrade)
  - Admin `GradeController` (store, update) also blocked unless user role is `manager`
  - Managers can still override grade edits for finalized semesters
- **Frontend:** Semesters page shows status badges + transition buttons with confirmation dialogs

### Academic Progression & Retake Enrollment

**Service:** `app/Services/AcademicProgressionService.php`
**Controller:** `app/Http/Controllers/Api/AcademicProgressionController.php`
**Frontend:** Integrated as Tab 2 ("الترقية الأكاديمية") in `frontend/src/pages/Grades.tsx`
**Permission:** `students:edit` (manager only)

#### Evaluation Flow
1. Manager searches for a student on the "الترقية الأكاديمية" page (`/academic-progression`)
2. `evaluateStudent()` computes:
   - **Credits earned** — sum of `subject.credits` from unique passed `StudentSubjectEnrollment` records (no double-counting retakes)
   - **Cumulative GPA** — groups enrollments by subject, takes best result per subject (passed > highest grade), computes `sum(gpa_points × credits) / sum(credits)` using the `StudentPortalService::aggregateGrades()` grading scale
   - **Academic standing** — determined by GPA thresholds:
     - ≥ 3.5 → `deans_list`
     - ≥ 2.0 → `good_standing`
     - < 2.0 (first time) → `probation`
     - < 2.0 (already `probation`) → `dismissed` (escalation)
     - < 1.0 → `dismissed` immediately
   - **Highest completed semester** — highest consecutive semester number with at least one passed enrollment
3. Result is persisted to `student_academic_progress` via upsert

#### Promotion Flow
1. Promotion eligibility: not `dismissed`, GPA ≥ 1.0, at least one completed semester, not exceeding 8 semesters
2. On promote: student `year` is updated (`year = ceil(next_semester / 2)`), progress record advances to next semester
3. **Bulk operations:** bulk-evaluate and bulk-promote iterate all active students (optionally filtered by department)

#### Retake Enrollment Flow (5.2)
1. `getRetakeableSubjects(studentId)` finds enrollments with `status=failed` or `passed=false`, excludes subjects with active retake enrollments or already passed
2. Manager selects subjects, target semester/year in the retake modal
3. `enrollRetakeSubjects()` validates subjects are retakeable, re-checks prerequisites via `EnrollmentService::checkPrerequisites()`, creates new `StudentSubjectEnrollment` with `is_retake=true` and `original_enrollment_id` pointing to the failed enrollment

#### API Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/academic-progression/student/{id}/evaluate` | Evaluate student academic standing |
| POST | `/academic-progression/student/{id}/promote` | Promote student to next semester |
| GET | `/academic-progression/student/{id}/retakeable-subjects` | Get failed subjects eligible for retake |
| POST | `/academic-progression/student/{id}/enroll-retake` | Enroll student in retake subjects |
| POST | `/academic-progression/bulk-evaluate` | Bulk evaluate all active students |
| POST | `/academic-progression/bulk-promote` | Bulk promote all eligible students |

#### Key Constants
- `GPA_GOOD_STANDING` = 2.0
- `GPA_DEANS_LIST` = 3.5
- `GPA_DISMISSAL` = 1.0
- `PASS_PERCENTAGE` = 50.0
- `MAX_SEMESTERS` = 8

### Grade Management Flow
- **Draft → Publish workflow:**
  1. Teacher opens `/teacher/grades`, selects subject and grade type, enters grades
  2. **"حفظ كمسودة" (Save as Draft):** saves with `is_published = false` — students cannot see
  3. **"حفظ ونشر" (Save & Publish):** saves with `is_published = true` — immediately visible to students
  4. In overview mode, teacher can toggle publish per-student or bulk via `POST /api/teacher-portal/grades/publish`
  5. Status bar shows draft count, published count, and failure count (<50%)
  6. Student portal (`GET /api/student-portal/my-grades`) only returns grades where `is_published = true`
- **Grading scale (Arab university standard):**
  | Letter | Label | Range | GPA |
  |--------|-------|-------|-----|
  | A | ممتاز (Excellent) | 90-100% | 4.0 |
  | B | جيد جداً (Very Good) | 80-89% | 3.3 |
  | C | جيد (Good) | 70-79% | 2.7 |
  | D | مقبول (Acceptable) | 60-69% | 2.0 |
  | D- | مقبول ضعيف (Weak Pass) | 50-59% | 1.0 |
  | F | راسب (Fail) | <50% | 0.0 |
- **Failure handling:**
  - **Pass threshold:** 50% per subject (sum of grade_value / sum of max_grade)
  - **Student portal:** single table with subjects as rows, grade-type columns auto-shown based on data. Failure = red text on the grade number/percentage/letter only (no red containers or banners). Status column shows "راسب — إعادة" in red text. Footer shows count of subjects needing retake.
  - **Teacher overview:** failing students get red text on total/percentage + "راسب" badge next to name, letter grade column shows F in red
  - Backend computes `status` (passed/failed), `needs_retake` flag, `letter_grade`, and `gpa` per subject
  - Overall GPA computed across all subjects and returned in API response
- **Student grades UI (`StudentGrades.tsx`):**
  - Single summary table: subjects as rows, dynamic grade-type columns (classwork, homework, midterm, final, etc. — only columns with data shown)
  - Click a subject row to expand detailed breakdown below the table (individual grades, teacher, date, feedback)
  - Compact inline grade scale legend at bottom
  - GPA shown in header subtitle, not as a card
- **Grade types:** classwork, homework, assignment, quiz, midterm, final, project, participation (8 types matching DB enum)
- **Validation:**
  - `grade_value` must not exceed `max_grade` — enforced in `TeacherPortalController::storeGrades`, `GradeController::store`, and `GradeController::update`
  - `GradeController::update` uses `$request->only()` to prevent mass-assignment of unintended fields
- **Performance optimizations:**
  - `storeGrades` batch-loads existing grades in 1 query (keyed by `student_id|grade_type|grade_name`) instead of N+1 per-grade lookups
  - `student_grades` table indexes: `idx_student_published_date`, `idx_subject_teacher`, `idx_semester`, `idx_grade_upsert`
  - `semester_id` FK for semester-scoped queries
- **Teacher portal grade routes:**
  - `GET /api/teacher-portal/subjects/{id}/grades` — fetch grades + enrolled students for a subject
  - `POST /api/teacher-portal/grades` — batch create/update grades (default draft)
  - `POST /api/teacher-portal/grades/publish` — bulk publish/unpublish by grade IDs
  - `PUT /api/teacher-portal/grades/{id}` — update single grade
  - `DELETE /api/teacher-portal/grades/{id}` — delete single grade
- **Admin grade routes:** `/api/grades` CRUD with semester_id support, letter_grade/gpa in `studentSubjectGrades`, eager-loaded semester relation

---

## Environment Configuration

### Backend (`backend/.env`)
```
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=uni_feta
JWT_SECRET=<generated-key>
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## Running the Application

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan serve          # Starts on http://127.0.0.1:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                # Starts on http://localhost:5173
```

---

## Key Dependencies

### Frontend
| Package | Purpose |
|---------|---------|
| `react` 18 | UI framework |
| `react-router-dom` 6 | Client-side routing |
| `@tanstack/react-query` 5 | Server state management |
| `tailwindcss` 3.4 | Utility-first CSS |
| `lucide-react` | Icon library |
| `qrcode` | QR code generation |
| `zod` | Schema validation |
| `react-hook-form` | Form management |
| `framer-motion` | Animations |
| `clsx` + `tailwind-merge` | Class name utilities |

### Backend
| Package | Purpose |
|---------|---------|
| `laravel/framework` 12 | PHP framework |
| `php-open-source-saver/jwt-auth` 2.8 | JWT authentication |
