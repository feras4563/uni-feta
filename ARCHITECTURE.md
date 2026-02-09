# University Management System — Architecture

## Overview

A full-stack university management system for **University of Alkhalil** (جامعة الخليل الأهلية). The application manages students, teachers, departments, subjects, timetables, fees, attendance, grades, and a full double-entry accounting system.

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

Three roles: **manager**, **staff**, **teacher**

| Resource | Manager | Staff | Teacher |
|----------|---------|-------|---------|
| students | CRUD | view, create | view |
| teachers | CRUD | view | — |
| departments | CRUD | view | view |
| subjects | CRUD | view, create | view |
| fees | CRUD | view, create | — |
| finance | CRUD | — | — |
| attendance | CRUD | — | view, create, edit |
| grades | CRUD | — | CRUD |
| sessions | CRUD | — | CRUD |
| schedule | CRUD | — | view, edit |
| settings | CRUD | — | — |

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
| `semesters` | Semester | Semester periods within study years |

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
| `student_subject_enrollments` | StudentSubjectEnrollment | Student enrolled in specific subjects |
| `student_groups` | StudentGroup | Groups of students for scheduling |
| `student_academic_progress` | StudentAcademicProgress | Academic progress tracking |

### Scheduling & Timetable
| Table | Model | Description |
|-------|-------|-------------|
| `teacher_subjects` | TeacherSubject | Teacher-to-subject assignments per semester |
| `rooms` | Room | Physical classrooms/labs |
| `time_slots` | TimeSlot | Available time periods |
| `timetable_entries` | TimetableEntry | Scheduled classes (group + subject + teacher + room + time) |
| `class_schedules` | ClassSchedule | Teacher availability schedules |
| `class_sessions` | ClassSession | Individual class session instances |

### Attendance & Grades
| Table | Model | Description |
|-------|-------|-------------|
| `attendance_records` | AttendanceRecord | Per-session attendance |
| `student_grades` | StudentGrade | Student grades per subject |

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
| `/semesters` | SemesterController | `/current`, `/set-current`, `/{id}/registered-students` |
| `/rooms` | RoomController | — |
| `/student-groups` | StudentGroupController | `/create-from-registrations`, `/auto-create`, `/auto-assign`, `/{id}/students`, `/{id}/available-students` |
| `/student-enrollments` | StudentEnrollmentController | `/student/{id}` |
| `/student-registrations` | StudentRegistrationController | `/register` |
| `/teacher-subjects` | TeacherSubjectController | `/all` |
| `/attendance` | AttendanceController | `/sessions`, `/session/{id}`, `/session/{id}/statistics`, `/student/{id}` |
| `/grades` | GradeController | `/student/{id}`, `/subject/{id}`, `/student/{sid}/subject/{subid}` |
| `/timetable` | TimetableController | `/entries`, `/group/{id}`, `/teacher/{id}`, `/auto-generate`, `/semester/{id}` |
| `/class-schedules` | ClassScheduleController | `/teacher/{id}` |
| `/accounts` | AccountController | `/tree`, `/parent-accounts`, `/general-ledger/summary`, `/{id}/general-ledger` |
| `/journal-entries` | JournalEntryController | `/{id}/post`, `/{id}/cancel` |
| `/account-defaults` | AccountDefaultController | — |
| `/invoices` | StudentInvoiceController | `/all`, `/basic`, `/statistics`, `/{id}/status` |
| `/payment-modes` | PaymentModeController | — |
| `/payment-entries` | PaymentEntryController | — |
| `/fees` | FeeController | `/statistics`, `/{id}/payment`, `/{id}/toggle-attendance` |
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
| `/attendance` | Attendance | Attendance management |
| `/grades` | Grades | Grade management |
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
| `/teacher/sessions` | ClassSessions | Manage class sessions, QR attendance |
| `/teacher/subject-groups` | TeacherSubjectGroups | View assigned subject groups |
| `/teacher/grades` | *(placeholder)* | Grade management (coming soon) |
| `/teacher/schedule` | *(placeholder)* | Schedule view (coming soon) |

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
- **Subject** → belongsToMany Departments, hasMany TeacherSubjects, hasMany Prerequisites
- **Account** → hierarchical (parent/children), hasMany JournalEntryLines

### Middleware
- `auth:api` — JWT authentication guard on all protected routes
- CORS configured for frontend origin

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
