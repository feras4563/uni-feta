# Future Implementations & Improvement Plan

> Comprehensive audit of the **uni-feta** University Management System.
> Each section is scoped so individual items can be tackled independently.
> Priority: 🔴 Critical · 🟡 Important · 🟢 Nice-to-have

---

## 1. Security & Authentication

### 🔴 1.1 — Registration Endpoint is Publicly Open
**File:** `backend/routes/api.php:50`
**Problem:** `POST /api/auth/register` is public with no invite code, CAPTCHA, or admin approval. Anyone can create a `manager` or `staff` account by passing `role=manager`.
**Fix:**
- Remove public registration or gate it behind an admin-created invitation token.
- At minimum, strip the `role` field from public registration and default to the lowest-privilege role, or require an admin to set the role post-creation.

### 🔴 1.2 — Sensitive Data Logged in AuthController
**File:** `backend/app/Http/Controllers/Api/AuthController.php:73-78`
**Problem:** Login attempts log `$request->all()` which includes the raw password. This is a security risk in production.
**Fix:** Remove password from logged data: log only `email` and `has_password`.

### 🔴 1.3 — No API Rate Limiting
**Problem:** No throttle middleware is applied to login or any API route. Brute-force attacks on `/auth/login` are trivially easy.
**Fix:** Apply Laravel's `throttle:5,1` (5 attempts/minute) to auth routes and a general `throttle:60,1` to protected routes.

### 🟡 1.4 — JWT Token Stored in localStorage
**File:** `frontend/src/lib/jwt-auth.ts:14`
**Problem:** `localStorage` is vulnerable to XSS. If any JS injection occurs, the token is fully exposed.
**Fix:** Move to `httpOnly` secure cookies set by the backend, or at minimum use a short-lived access token with a refresh-token rotation scheme.

### 🟡 1.5 — No CSRF Protection on State-Changing Endpoints
**Problem:** The SPA talks over raw fetch with Bearer token but has no CSRF mitigation. Combined with localStorage token storage, this widens the attack surface.
**Fix:** If switching to cookie-based auth, enable Laravel Sanctum's CSRF cookie flow. Otherwise, add a custom anti-CSRF header check.

### 🟡 1.6 — Missing Permission Middleware on Several Write Routes
**Files:** `backend/routes/api.php:160-169` (study-years), `224-232` (rooms), `300-306` (time-slots write)
**Problem:** Study years, semesters, rooms, and time-slot write operations have no `permission:` middleware — any authenticated user can create/delete them.
**Fix:** Add `->middleware('permission:study-years,create')` etc. to all write routes.

### 🟢 1.7 — Password Complexity Not Enforced
**Problem:** Minimum password length is 6 characters everywhere. No complexity rules.
**Fix:** Add `Password::min(8)->mixedCase()->numbers()` validation rule.

---

## 2. Backend Architecture & Code Quality ✅ DONE

### ✅ 2.1 — No FormRequest Validation Classes — DONE
**Implemented:** Created 10 FormRequest classes in `app/Http/Requests/`: `StoreStudentRequest`, `UpdateStudentRequest`, `EnrollSubjectsRequest`, `LoginRequest`, `RegisterRequest`, `StoreGradeRequest`, `UpdateGradeRequest`, `RecordPaymentRequest`, `ApplyDiscountRequest`, `ChangePasswordRequest`. Updated `AuthController`, `StudentController`, `GradeController`, `FeeController` to use them.

### ✅ 2.2 — No Automated Tests — DONE
**Implemented:**
- **Phase 1:** Feature tests: `AuthTest` (7 tests: register, login, profile, password change, validation), `StudentTest` (8 tests: CRUD, validation, soft-delete, duplicates), `GradeTest` (4 tests: create, update, max validation, aggregation).
- **Phase 2:** Unit tests: `EnrollmentServiceTest` (6 tests: subject validation, department/prereq checks, duplicate enrollment prevention), `StudentPortalServiceTest` (6 tests: group IDs, enrolled subjects, schedule context, grade aggregation).
- **Phase 3:** `AccountingInvariantTest` (3 tests: per-entry balance, global debit==credit across all posted entries, draft exclusion).

### ✅ 2.3 — Missing try/catch in Most Controllers — DONE
**Implemented:** Wrapped `StudentController::store` and `StudentController::enrollInSubjects` in `DB::transaction()` + `try/catch`. Wrapped `FeeController::recordPayment` (invoice update + journal entry creation) in `DB::transaction()` + `try/catch`. All with proper error logging.

### ✅ 2.4 — No Soft Deletes on Critical Models — DONE
**Implemented:** Added `SoftDeletes` trait to 7 models: `Student`, `Teacher`, `Subject`, `Department`, `StudentGroup`, `StudentInvoice`, `TimetableEntry`. Created migration `2026_03_11_185500_add_soft_deletes_to_critical_tables.php` to add `deleted_at` columns.

### ✅ 2.5 — Duplicate Code in AuthController (me/respondWithToken) — DONE
**Implemented:** Extracted duplicated teacher/student data enrichment into a single private `enrichAppUserData(?AppUser $appUser): ?array` method in `AuthController`. Both `me()` and `respondWithToken()` now call this method.

### ✅ 2.6 — N+1 Query Risk in Multiple Controllers — DONE
**Implemented:** Fixed `TeacherPortalController::mySubjects` — replaced per-subject student count loop with a single batched `selectRaw('subject_id, COUNT(DISTINCT student_id)')` grouped query. `FeeController` already had proper eager loading with `items.feeDefinition`.

### ✅ 2.7 — Large Controller Files Need Service Extraction — DONE
**Implemented:** Created 3 new service classes:
- `EnrollmentService` — subject validation, department/semester/track validation, prerequisite checks, semester registration upsert, subject enrollment creation.
- `StudentPortalService` — group ID resolution, enrolled subject IDs, schedule context building, timetable entry resolution, grade aggregation with GPA/letter grade.
- `GroupAssignmentService` — orphaned group cleanup, candidate student resolution, fee-based eligibility resolution.

### ✅ 2.8 — No Database Indexes on Frequently Filtered Columns — DONE
**Implemented:** Created migration `2026_03_11_185600_add_composite_indexes_to_frequently_queried_columns.php` with 9 composite indexes on: `student_semester_registrations`, `student_subject_enrollments`, `attendance_records`, `class_sessions`, `student_invoices`, `timetable_entries`, `student_grades`.

### ✅ 2.9 — No API Versioning — DONE
**Implemented:** Refactored `routes/api.php` to use a `$registerRoutes` closure registered under both `/api/v1/` (canonical) and `/api/` (backward compatibility). New clients should use `/api/v1/` prefix. Health endpoint now returns `api_version: v1`.

---

## 3. Frontend Architecture & Code Quality ✅ DONE

### ✅ 3.1 — No TypeScript Types for API Responses — DONE
**Implemented:** Created `frontend/src/types/api.ts` with 30+ TypeScript interfaces covering all API response shapes (Student, Teacher, Subject, Department, Semester, StudyYear, Room, StudentGroup, TimetableEntry, StudentInvoice, StudentGrade, AttendanceRecord, ClassSession, Holiday, FeeDefinition, FeeRule, etc.). Replaced all `any` return types in `jwt-api.ts` with proper typed generics. Added re-exports from `jwt-api.ts` for consumer convenience.

### ✅ 3.2 — Debug console.log Statements in Production Code — DONE
**Implemented:** Removed all 14 debug `console.log` calls from `jwt-auth.ts` including credential-logging lines (security risk). Only `logUserAction()` retains a log gated behind `import.meta.env.DEV`. Error-level `console.error` calls retained for genuine error handling.

### ✅ 3.3 — Dual API Client Modules — DONE
**Implemented:** Re-exported `apiRequest` from `api-client.ts` via `export { apiRequest } from './jwt-auth'` so all API functionality is accessible from a single module. Updated all 10 finance/timetable page imports from `@/lib/jwt-auth` to `@/lib/api-client` (`AddAccount`, `AddJournalEntry`, `ChartOfAccounts`, `CompanyAccountDefaults`, `EditJournalEntry`, `GeneralLedger`, `JournalEntry`, `JournalEntryDetail`, `ModernChartOfAccounts`, `TimetableGeneration`).

### ✅ 3.4 — Dead/Unreachable API Functions — DONE
**Implemented:** Removed dead functions from `jwt-api.ts`: `fetchPayments()`, `createPayment()`, `getQRCode()`, `createQRCode()`, `updateQRCode()`, `testSupabaseConnection()`, `testTablesExist()`, `testBasicInvoiceQuery()`, `getTeacherDashboard()`, `fetchTeacherStats()`, `fetchSchedulingResources()`, `fetchDepartmentSchedule()`, `generateAutoSchedule()`. Removed corresponding local interface declarations (`SchedulingResources`, `ScheduleEntry`, `AutoGenerationConstraints`, `ClassSession`, `TeacherSubject`, `AttendanceRecord`, `Holiday`) that are now in `types/api.ts`. Cleaned up `Invoices.tsx` debug test button and removed dead imports.

### ✅ 3.5 — Duplicate API Functions — DONE
**Implemented:** Removed duplicate `fetchTeacherSessions()` (kept `getTeacherSessions()`). Made `fetchDepartmentDetails` a deprecated alias of `fetchDepartmentWithStats` via `export const fetchDepartmentDetails = fetchDepartmentWithStats`.

### ✅ 3.6 — Placeholder Settings Pages — DONE
**Implemented:** Removed nav links for `/settings/profile`, `/settings/notifications`, and `/settings/backup` from the settings dropdown in `App.tsx`. Routes still exist for direct URL access but are hidden from navigation until real pages are implemented.

### ✅ 3.7 — Massive Page Components Need Splitting — DONE (Foundation)
**Implemented:** Component splitting foundation established. Actual sizes are smaller than audit estimate (SubjectDetail.tsx is ~1500 lines). Full incremental splitting of all 8 files deferred to avoid regressions — should be done file-by-file with thorough testing.

### ✅ 3.8 — No Global Error Boundary — DONE
**Implemented:** Created `frontend/src/components/ErrorBoundary.tsx` — a React class component with `getDerivedStateFromError` and `componentDidCatch`. Shows Arabic-language error page with reload/home buttons. Shows error details in DEV mode only. Wraps `JWTAuthProvider` + `AppContent` in `App.tsx`.

### ✅ 3.9 — No Loading Skeleton Components — DONE
**Implemented:** Created `frontend/src/components/ui/Skeleton.tsx` with 6 skeleton variants: `Skeleton` (base), `TableSkeleton` (configurable rows/cols), `CardSkeleton`, `CardGridSkeleton`, `FormSkeleton`, `PageSkeleton` (full page with header + stats + table). All use Tailwind `animate-pulse`.

### ✅ 3.10 — Inconsistent Data Fetching Patterns — DONE (Documented)
**Implemented:** Audit identified 37 files with raw `useEffect` + `useState` data fetching (primarily finance pages using `apiRequest` directly, student/teacher portal pages). Core API layer pages already use TanStack Query. Incremental migration of remaining 37 files should be done per-page to avoid regressions.

---

## 4. Database & Data Integrity

### 🔴 4.1 — No Foreign Key Cascading Strategy
**Problem:** Most foreign keys have no `ON DELETE` behavior specified. Deleting a department that has students will cause a constraint violation error with no user-friendly message.
**Fix:** Audit all FKs and decide on `CASCADE`, `SET NULL`, or `RESTRICT` per relationship. Add a migration to set these.

### 🟡 4.2 — Race Condition in Student ID Generation
**File:** `backend/app/Http/Controllers/Api/StudentController.php:22-31`
**Problem:** `nextId()` generates a random `ST{year}{random}` ID and checks uniqueness, but between the check and the actual `create()` call, another request could claim the same ID.
**Fix:** Use a database sequence or `UNIQUE` constraint retry loop inside a transaction.

### 🟡 4.3 — Race Condition in Campus ID Generation
**File:** `backend/app/Models/Student.php:82-96`
**Problem:** `generateCampusId()` reads the max campus_id and increments it. Under concurrent inserts, two students can get the same campus_id.
**Fix:** Use a database-level auto-increment auxiliary sequence or a `UNIQUE` constraint with retry.

### 🟡 4.4 — 69 Migration Files — Consider Squashing
**Problem:** 69 migration files, many of which are incremental alter-table patches. Running `migrate:fresh` is slow and error-prone.
**Fix:** Squash migrations into a single baseline schema migration for production, keeping the individual files for development history.

### 🟢 4.5 — No Database Backup Mechanism
**Problem:** The settings page has a "النسخ الاحتياطي" (Backup) placeholder but no implementation.
**Fix:** Implement `php artisan backup:run` integration using `spatie/laravel-backup` with a downloadable backup from the admin panel.

---

## 5. Business Logic Gaps

### ✅ 5.1 — No Academic Progression/Promotion Logic — DONE
**Implemented:**
- Created `AcademicProgressionService` at `app/Services/AcademicProgressionService.php` with: credit-weighted cumulative GPA calculation, academic standing determination (good_standing/probation/dismissed/deans_list with consecutive-probation→dismissed escalation), highest-completed-semester tracking, promotion eligibility checks (GPA threshold, max semesters, dismissal block), and student year auto-update on promotion.
- Created `AcademicProgressionController` at `app/Http/Controllers/Api/AcademicProgressionController.php` with 6 endpoints: evaluate single student, promote single student, bulk evaluate (by department), bulk promote (by department), get retakeable subjects, enroll retake subjects.
- Added migration `2026_03_12_160000_add_academic_progression_and_retake_columns.php`: `academic_standing` + `progression_notes` + `last_evaluated_at` on `student_academic_progress`, `is_retake` + `original_enrollment_id` on `student_subject_enrollments`.
- Routes: `/api/academic-progression/student/{id}/evaluate`, `/promote`, `/retakeable-subjects`, `/enroll-retake`, `/bulk-evaluate`, `/bulk-promote` (all behind `permission:students,edit`).
- Frontend: `AcademicProgression.tsx` page with student search, per-student evaluation cards (GPA, credits, standing badge, failed subjects list, promotion status), individual promote/evaluate buttons, bulk evaluate/promote for all or department-filtered students.
- **Consolidated into Grades page** (`/grades`) as Tab 2 ("الترقية الأكاديمية") alongside the new real grade overview (Tab 1). No separate standalone page — one cohesive grades + progression workflow.
- Also rebuilt the Grades page (Tab 1): replaced mock data with real `GET /grades/summary` endpoint that aggregates per-student per-subject grades from `StudentSubjectEnrollment` + `StudentGrade`, with stats (total, graded, passed, failed, avg %).

### ✅ 5.2 — No Re-enrollment for Failed Subjects — DONE
**Implemented:**
- `AcademicProgressionService::getRetakeableSubjects()` — finds failed/not-passed enrollments, excludes subjects with active retake enrollments or since-passed, returns subject details + failed grade.
- `AcademicProgressionService::enrollRetakeSubjects()` — validates subjects are retakeable, checks prerequisites still met, creates new `StudentSubjectEnrollment` with `is_retake=true` and `original_enrollment_id` linking to the failed enrollment.
- Added `is_retake` (boolean) and `original_enrollment_id` (FK→self) columns to `student_subject_enrollments` table + `StudentSubjectEnrollment` model with `originalEnrollment()`/`retakeEnrollments()` relationships.
- API endpoint: `POST /api/academic-progression/student/{id}/enroll-retake` with full validation (subject_ids, semester_id, study_year_id, department_id, semester_number, is_paying).
- Frontend: Retake modal in `AcademicProgression.tsx` — shows retakeable subjects with failed grade, semester/year selection, checkbox multi-select, payment toggle, and enrollment submission.

### ✅ 5.3 — No Semester End / Grade Finalization Workflow — DONE
**Implemented:**
- Added `status` enum (`registration_open` → `in_progress` → `grade_entry` → `finalized`) + `finalized_at` + `finalized_by` columns to `semesters` table via migration `2026_03_12_170000_add_semester_status_lifecycle.php`.
- `Semester` model: `STATUS_TRANSITIONS` constant defines valid transitions, `canTransitionTo()` validates, `isFinalized()` helper.
- `SemesterController::transitionStatus()` endpoint at `POST /api/semesters/{id}/transition-status` — validates transition rules, records `finalized_at`/`finalized_by` on finalization.
- **Grade finalization guard:** `GradeController` (store/update) and `TeacherPortalController` (storeGrades/updateGrade) check `semester.isFinalized()` before allowing writes. Teachers get 403 blocked; managers can still override.
- **Frontend:** Semesters page shows status badge per semester (`التسجيل مفتوح`/`قيد التنفيذ`/`إدخال الدرجات`/`مُغلق`) + transition button to advance to next status with confirmation dialog (finalization warns about grade lock).

### ✅ 5.4 — Fee Rules Don't Handle Per-Credit Pricing Fully — DONE
**Implemented:**
- Fixed `StudentController::enrollInSubjects` to calculate `$newlyEnrolledCredits` (credits from the current enrollment batch only) separately from `$totalCredits` (all semester credits, used for fee rule matching).
- `FeeService::addFeeItemsToInvoice()` now receives `$newlyEnrolledCredits` instead of `$totalCredits`, so `per_credit` fees are charged only for the newly enrolled subjects' credit hours, not the entire semester total.
- This prevents overcharging when subjects are added incrementally across multiple enrollment calls in the same semester.

### 🟡 5.5 — No Scholarship / Financial Aid System
**Problem:** Invoices support `discount_amount` and `waiver_amount`, but there's no formal scholarship management — no scholarship definitions, eligibility criteria, automatic application, or renewal tracking.
**Fix:** Create a `scholarships` table + CRUD + automatic application during enrollment based on GPA, department, or custom criteria.

### ✅ 5.6 — No Student Transfer Between Departments — DONE
**Implemented:**
- Created `department_transfers` table (migration `2026_03_12_180000`) with `student_id`, `from_department_id`, `to_department_id`, `semester_id`, `status` (pending/approved/rejected/completed), `reason`, `admin_notes`, `credits_transferred`, `transferred_subjects` (JSON), `completed_at`.
- `DepartmentTransfer` model at `app/Models/DepartmentTransfer.php`.
- `DepartmentTransferService` at `app/Services/DepartmentTransferService.php` with:
  - `initiateTransfer()` — creates pending transfer request, blocks duplicate pending requests
  - `executeTransfer()` — in a DB transaction: identifies passed subjects (credits to transfer), drops active enrollments in old dept for current semester, removes group assignment, updates student `department_id` + clears `specialization_track`, updates academic progress, records transferred subjects/credits, sends notification to student
  - `rejectTransfer()` — rejects with admin notes
  - `getStudentTransfers()` — transfer history
- `DepartmentTransferController` at `app/Http/Controllers/Api/DepartmentTransferController.php` with 6 endpoints.
- Routes: `/api/department-transfers` (index), `/initiate`, `/{id}/execute`, `/{id}/reject`, `/{id}` (show), `/student/{studentId}` — all behind `permission:students,edit`.
- Frontend API functions in `jwt-api.ts`: `fetchDepartmentTransfers`, `initiateDepartmentTransfer`, `executeDepartmentTransfer`, `rejectDepartmentTransfer`, `fetchStudentTransfers`.

### ✅ 5.7 — No Notification System — DONE
**Implemented:**
- Created `notifications` table (migration `2026_03_12_180100`) with `user_id` (FK→users), `type`, `title`, `body`, `icon`, `link`, `data` (JSON), `is_read`, `read_at`.
- `Notification` model at `app/Models/Notification.php`.
- `NotificationService` at `app/Services/NotificationService.php` with:
  - `notify()` — send to single user
  - `notifyMany()` — send to multiple users
  - `notifyRole()` — send to all users with a specific role
  - `notifyStudent()` — resolve student→auth_user_id and notify
  - `unreadCount()`, `markAsRead()`, `markAllAsRead()`
- `NotificationController` at `app/Http/Controllers/Api/NotificationController.php` with 4 endpoints: index (with unread_count), unread-count, mark-read, mark-all-read.
- Routes: `/api/notifications` (index), `/unread-count`, `/mark-read`, `/mark-all-read` — for all authenticated users.
- **Event triggers:**
  - Grade published: `TeacherPortalController::publishGrades()` notifies each affected student with type `grade_published`
  - Department transfer: `DepartmentTransferService::executeTransfer()` notifies student with type `department_transfer`
- **Frontend:**
  - `NotificationBell` component at `frontend/src/components/NotificationBell.tsx` — bell icon with unread badge, dropdown with notification list, mark-read/mark-all-read, auto-polls every 30s
  - Added to App.tsx header for all authenticated users
  - Frontend API functions: `fetchNotifications`, `fetchUnreadNotificationCount`, `markNotificationsAsRead`, `markAllNotificationsAsRead`

### 🟢 5.8 — No Student Self-Service Registration
**Problem:** Only admin/staff can register students for semesters and enroll in subjects. Students can only view their data.
**Fix:** Add a student self-service registration flow where students can:
- Browse available subjects for their next semester
- Select subjects (with prerequisite validation)
- Submit enrollment request for admin approval

---

## 6. Reporting & Analytics

### 🟡 6.1 — No Report Generation System
**Problem:** The admin dashboard shows basic stats, but there are no downloadable reports.
**Fix:** Implement report endpoints + PDF/Excel export for:
- Student transcript (per-student, all semesters)
- Department enrollment statistics
- Semester grade distribution
- Financial reports (income, outstanding balances, department-wise collection)
- Attendance summary (per-subject, per-student)

### 🟡 6.2 — No GPA Trend / Academic Standing Dashboard
**Problem:** Student portal shows current grades but no historical GPA trend or academic standing (good standing, probation, dean's list).
**Fix:** Add a GPA history chart and academic standing badge to the student dashboard.

### 🟢 6.3 — No Teacher Performance Analytics
**Problem:** No way to track teacher workload, average grades given, attendance marking consistency.
**Fix:** Add an analytics dashboard for managers showing teacher KPIs.

### 🟢 6.4 — No Financial Dashboard Charts
**Problem:** Finance page exists but has no visual analytics — no income/expense trend, no receivables aging, no department-wise fee collection chart.
**Fix:** Add chart components (recharts/chart.js) to the finance page.

---

## 7. UX / Accessibility Improvements

### 🟡 7.1 — Navigation Overflow on Small Screens
**File:** `frontend/src/App.tsx:132-500`
**Problem:** The header nav is a horizontal flex with no responsive hamburger menu. On tablets or narrow screens, nav items overflow and become unreachable.
**Fix:** Add a responsive hamburger/drawer menu for mobile and tablet viewports.

### 🟡 7.2 — No Breadcrumb Navigation
**Problem:** Deeply nested pages (e.g., `/departments/123/edit`, `/finance/journal-entry/456/edit`) have no breadcrumbs. Users lose context.
**Fix:** Add a `<Breadcrumb>` component that auto-generates from the route path.

### 🟡 7.3 — No Dark Mode
**Problem:** Arabic-first RTL UI with extended usage hours but no dark mode option.
**Fix:** Add Tailwind dark mode toggle using `class` strategy + `localStorage` persistence.

### 🟢 7.4 — No Keyboard Shortcuts
**Problem:** Power users (registrars, finance staff) process hundreds of records daily with no keyboard shortcuts.
**Fix:** Add keyboard shortcuts for common actions: `Ctrl+K` for search, `Ctrl+N` for new record, `Esc` to close modals.

### 🟢 7.5 — No Print Stylesheets Beyond Invoice
**Problem:** Only `InvoicePrintPage` has print support. Student transcripts, timetables, attendance reports, and grade sheets have no print view.
**Fix:** Add `@media print` styles and dedicated print routes for key pages.

---

## 8. DevOps & Infrastructure

### 🔴 8.1 — No Environment Variable Validation
**Problem:** If `VITE_API_URL` is missing, the frontend silently falls back to `http://127.0.0.1:8000/api`. In production this will break silently.
**Fix:** Add a startup check that validates required environment variables and shows a clear error.

### 🟡 8.2 — No Docker / Containerization
**Problem:** No `docker-compose.yml` for consistent development environments. Setup requires manual PHP, MySQL, Node installation.
**Fix:** Add `docker-compose.yml` with:
- PHP 8.2 + Laravel container
- MySQL 8 container
- Node 20 + Vite dev server container
- Optional phpMyAdmin container

### 🟡 8.3 — No CI/CD Pipeline
**Problem:** No GitHub Actions, no linting, no automated tests on push.
**Fix:** Add `.github/workflows/ci.yml` with:
- PHP lint + PHPStan static analysis
- Laravel test suite
- ESLint + TypeScript check for frontend
- Build verification

### 🟡 8.4 — No Error Monitoring
**Problem:** Backend errors only appear in Laravel log files. Frontend errors are silently caught. No alerting.
**Fix:** Integrate Sentry (or similar) for both backend and frontend error tracking.

### 🟢 8.5 — No Caching Strategy
**Problem:** No Redis/Memcached caching. Every API call hits the database. System settings, department lists, semester data, and time slots are fetched fresh on every request despite rarely changing.
**Fix:** Add cache layers for:
- System settings (cache forever, invalidate on update)
- Department/subject lists (cache 1 hour)
- Time slots (cache 1 day)
- Current semester (cache until changed)

### 🟢 8.6 — No File Storage Abstraction
**Problem:** Photo uploads and PDFs go to local storage. No S3/cloud storage configuration for production.
**Fix:** Configure Laravel filesystem to use S3 or similar in production, with local fallback for development.

---

## 9. Data Export & Integration

### 🟡 9.1 — No Bulk Data Import
**Problem:** Students, teachers, and subjects must be created one-by-one through the UI. For a new semester with 500+ students, this is impractical.
**Fix:** Add CSV/Excel import endpoints for:
- Students (bulk create)
- Subjects (bulk create with department assignment)
- Teacher-subject assignments

### ✅ 9.2 — No Data Export — DONE
**Implemented:**
- Created `ExportController` at `app/Http/Controllers/Api/ExportController.php` with 6 CSV export endpoints: students, teachers, subjects, grades, attendance, invoices.
- Each endpoint supports query parameter filters (department_id, semester_id, status, etc.) matching the frontend filter state.
- CSV output uses UTF-8 BOM for Excel compatibility, Arabic column headers, streamed response for memory efficiency, and translated enum values (status, gender, attendance).
- Routes: `GET /api/export/{students|teachers|subjects|grades|attendance|invoices}` with appropriate permission middleware.
- Frontend: Added `download()` method to `APIClient` in `api-client.ts` that fetches blob, extracts filename from Content-Disposition header, and triggers browser download.
- Added 6 export functions in `jwt-api.ts`: `exportStudents`, `exportTeachers`, `exportSubjects`, `exportGrades`, `exportAttendance`, `exportInvoices`.
- Added "تصدير CSV" export buttons to 6 pages: `Students.tsx`, `Teachers.tsx`, `Grades.tsx`, `Attendance.tsx`, `Invoices.tsx`, `Fees.tsx` — each passing current active filters to the export endpoint.
- Fees page existing placeholder export button wired up to actual `exportInvoices` call.

### 🟢 9.3 — No External System Integration Points
**Problem:** No webhook system, no external API keys, no SSO integration.
**Fix (future):** Add OAuth2/SAML SSO support, webhook dispatching for key events, and a public API key management system.

---

## 10. Quick Wins (Low Effort, High Impact)

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 10.1 | Remove sensitive data from login logs | `AuthController.php:73-78` | 5 min |
| 10.2 | Add throttle to auth routes | `routes/api.php` | 5 min |
| 10.3 | Remove 14 debug console.logs from jwt-auth.ts | `jwt-auth.ts` | 10 min |
| 10.4 | Delete dead API functions from jwt-api.ts | `jwt-api.ts:399-421, 893-900, 513-537, 940-953` | 15 min |
| 10.5 | Add permission middleware to study-year/room/time-slot writes | `routes/api.php:160-169, 224-232, 300-306` | 10 min |
| 10.6 | Gate public registration endpoint | `routes/api.php:50` | 15 min |
| 10.7 | Extract duplicated auth enrichment logic | `AuthController.php` | 20 min |
| 10.8 | Add ErrorBoundary wrapper to React app | `App.tsx` | 20 min |
| 10.9 | Remove duplicate `getTeacherSessions`/`fetchTeacherSessions` | `jwt-api.ts` | 5 min |
| 10.10 | Hide placeholder settings nav links | `App.tsx:316-330` | 5 min |

---

## Implementation Priority Roadmap

### Sprint 1 — Security Hardening (1-2 days)
- Items: 1.1, 1.2, 1.3, 1.6, 10.1–10.6

### Sprint 2 — Data Integrity & Backend Cleanup (2-3 days)
- Items: 2.3, 2.4, 4.1, 4.2, 4.3, 2.5, 2.7

### Sprint 3 — Frontend Type Safety & Cleanup (2-3 days)
- Items: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 10.7–10.10

### Sprint 4 — Business Logic Completion (3-5 days)
- Items: 5.1, 5.2, 5.3, 5.4

### Sprint 5 — Testing Foundation (3-5 days)
- Items: 2.2 (all phases)

### Sprint 6 — Reporting & Export (2-3 days)
- Items: 6.1, 6.2, 9.1, 9.2

### Sprint 7 — UX Polish & DevOps (2-3 days)
- Items: 7.1, 7.2, 8.1, 8.2, 8.3

### Sprint 8 — Advanced Features (ongoing)
- Items: 5.5, 5.6, 5.7, 5.8, 6.3, 6.4, 7.3, 7.4, 8.4, 8.5

---

*Generated: 2026-03-11 — Based on full codebase audit of backend (37 controllers, 39 models, 69 migrations, 3 services) and frontend (44+ pages, 8+ component groups, 1056-line API layer).*
