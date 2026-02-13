<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\StudyYearController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\SystemSettingsController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\StudentGroupController;
use App\Http\Controllers\Api\StudentEnrollmentController;
use App\Http\Controllers\Api\StudentSubjectEnrollmentController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\TimeSlotController;
use App\Http\Controllers\Api\TeacherSubjectController;
use App\Http\Controllers\Api\ClassScheduleController;
use App\Http\Controllers\Api\StudentRegistrationController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\JournalEntryController;
use App\Http\Controllers\Api\AccountDefaultController;
use App\Http\Controllers\Api\SubjectTitleController;
use App\Http\Controllers\Api\StudentInvoiceController;
use App\Http\Controllers\Api\PaymentModeController;
use App\Http\Controllers\Api\PaymentEntryController;
use App\Http\Controllers\Api\FeeController;
use App\Http\Controllers\Api\FeeDefinitionController;
use App\Http\Controllers\Api\FeeRuleController;
use App\Http\Controllers\Api\ActionLogController;
use App\Http\Controllers\Api\TeacherPortalController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserManagementController;
use App\Http\Controllers\Api\StudentPortalController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes (no authentication required)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// System Settings (public access for app initialization)
Route::get('/system-settings', [SystemSettingsController::class, 'index']);

// Time Slots (public read access for timetable display)
Route::get('/time-slots', [TimeSlotController::class, 'index']);
Route::get('/time-slots/{id}', [TimeSlotController::class, 'show']);

// Protected routes (authentication required)
Route::middleware('auth:api')->group(function () {
    
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
    });
    
    // Dashboard routes
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);
    });
    
    // Students Routes
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index'])->middleware('permission:students,view');
        Route::post('/', [StudentController::class, 'store'])->middleware('permission:students,create');
        Route::get('/next-id', [StudentController::class, 'nextId'])->middleware('permission:students,create');
        Route::get('/statistics', [StudentController::class, 'statistics'])->middleware('permission:students,view');
        Route::get('/count-by-department', [StudentController::class, 'countByDepartment'])->middleware('permission:students,view');
        Route::get('/{id}', [StudentController::class, 'show'])->middleware('permission:students,view');
        Route::get('/{id}/enrollments', [StudentController::class, 'enrollments'])->middleware('permission:students,view');
        Route::get('/{id}/subject-enrollments', [StudentController::class, 'subjectEnrollments'])->middleware('permission:students,view');
        Route::get('/{id}/invoices', [StudentController::class, 'invoices'])->middleware('permission:students,view');
        Route::get('/{id}/fee-summary', [StudentController::class, 'feeSummary'])->middleware('permission:fees,view');
        Route::post('/{id}/enroll-subjects', [StudentController::class, 'enrollInSubjects'])->middleware('permission:student-enrollments,create');
        Route::post('/{id}/upload-photo', [StudentController::class, 'uploadPhoto'])->middleware('permission:students,create');
        Route::put('/{id}', [StudentController::class, 'update'])->middleware('permission:students,edit');
        Route::patch('/{id}', [StudentController::class, 'update'])->middleware('permission:students,edit');
        Route::delete('/{id}', [StudentController::class, 'destroy'])->middleware('permission:students,delete');
    });

    // Departments Routes (manager only for write operations)
    Route::prefix('departments')->group(function () {
        Route::get('/', [DepartmentController::class, 'index']);
        Route::get('/{id}', [DepartmentController::class, 'show']);
        Route::get('/{id}/details', [DepartmentController::class, 'details']);
        Route::get('/{id}/statistics', [DepartmentController::class, 'statistics']);
        Route::get('/{id}/semesters/{semesterNumber}/subjects', [DepartmentController::class, 'getSemesterSubjects']);
        Route::get('/{id}/curriculum/semester/{semesterNumber}', [DepartmentController::class, 'getSemesterSubjects']);
        Route::post('/', [DepartmentController::class, 'store'])->middleware('permission:departments,create');
        Route::put('/{id}/semesters/{semesterNumber}/subjects', [DepartmentController::class, 'updateSemesterSubjects'])->middleware('permission:departments,edit');
        Route::put('/{id}', [DepartmentController::class, 'update'])->middleware('permission:departments,edit');
        Route::patch('/{id}', [DepartmentController::class, 'update'])->middleware('permission:departments,edit');
        Route::delete('/{id}', [DepartmentController::class, 'destroy'])->middleware('permission:departments,delete');
    });

    // Subjects Routes (manager only for write operations)
    Route::prefix('subjects')->group(function () {
        Route::get('/', [SubjectController::class, 'index']);
        Route::get('/department/{departmentId}', [SubjectController::class, 'byDepartment']);
        Route::get('/semester/{semesterNumber}', [SubjectController::class, 'bySemester']);
        Route::get('/{id}', [SubjectController::class, 'show']);
        Route::post('/{id}/check-prerequisites', [SubjectController::class, 'checkPrerequisites']);
        Route::post('/', [SubjectController::class, 'store'])->middleware('permission:subjects,create');
        Route::put('/{id}', [SubjectController::class, 'update'])->middleware('permission:subjects,edit');
        Route::patch('/{id}', [SubjectController::class, 'update'])->middleware('permission:subjects,edit');
        Route::delete('/{id}', [SubjectController::class, 'destroy'])->middleware('permission:subjects,delete');
    });

    // Subject Titles Routes (manager only for write operations)
    Route::prefix('subject-titles')->group(function () {
        Route::get('/', [SubjectTitleController::class, 'index']);
        Route::get('/{id}', [SubjectTitleController::class, 'show']);
        Route::post('/', [SubjectTitleController::class, 'store'])->middleware('permission:subjects,create');
        Route::put('/{id}', [SubjectTitleController::class, 'update'])->middleware('permission:subjects,edit');
        Route::patch('/{id}', [SubjectTitleController::class, 'update'])->middleware('permission:subjects,edit');
        Route::delete('/{id}', [SubjectTitleController::class, 'destroy'])->middleware('permission:subjects,delete');
    });

    // Teachers Routes (manager only for write operations)
    Route::prefix('teachers')->group(function () {
        Route::get('/', [TeacherController::class, 'index']);
        Route::get('/{id}', [TeacherController::class, 'show']);
        Route::get('/{id}/subjects', [TeacherController::class, 'subjects']);
        Route::get('/{id}/sessions', [TeacherController::class, 'sessions']);
        Route::get('/{id}/statistics', [TeacherController::class, 'statistics']);
        Route::post('/', [TeacherController::class, 'store'])->middleware('permission:teachers,create');
        Route::post('/with-departments', [TeacherController::class, 'storeWithDepartments'])->middleware('permission:teachers,create');
        Route::post('/{id}/upload-photo', [TeacherController::class, 'uploadPhoto'])->middleware('permission:teachers,edit');
        Route::put('/{id}', [TeacherController::class, 'update'])->middleware('permission:teachers,edit');
        Route::patch('/{id}', [TeacherController::class, 'update'])->middleware('permission:teachers,edit');
        Route::delete('/{id}', [TeacherController::class, 'destroy'])->middleware('permission:teachers,delete');
    });

    // Study Years Routes
    Route::prefix('study-years')->group(function () {
        Route::get('/', [StudyYearController::class, 'index']);
        Route::post('/', [StudyYearController::class, 'store']);
        Route::get('/current', [StudyYearController::class, 'current']);
        Route::post('/set-current', [StudyYearController::class, 'setCurrent']);
        Route::get('/{id}', [StudyYearController::class, 'show']);
        Route::put('/{id}', [StudyYearController::class, 'update']);
        Route::patch('/{id}', [StudyYearController::class, 'update']);
        Route::delete('/{id}', [StudyYearController::class, 'destroy']);
    });

    // Semesters Routes
    Route::prefix('semesters')->group(function () {
        Route::get('/', [SemesterController::class, 'index']);
        Route::post('/', [SemesterController::class, 'store']);
        Route::get('/current', [SemesterController::class, 'current']);
        Route::post('/set-current', [SemesterController::class, 'setCurrent']);
        Route::get('/{id}', [SemesterController::class, 'show']);
        Route::get('/{id}/registered-students', [SemesterController::class, 'getRegisteredStudents']);
        Route::put('/{id}', [SemesterController::class, 'update']);
        Route::patch('/{id}', [SemesterController::class, 'update']);
        Route::delete('/{id}', [SemesterController::class, 'destroy']);
    });

    // Attendance Routes
    Route::prefix('attendance')->group(function () {
        Route::get('/', [AttendanceController::class, 'index']);
        Route::post('/', [AttendanceController::class, 'store']);
        Route::post('/sessions', [AttendanceController::class, 'createSession']);
        Route::get('/sessions/{sessionId}', [AttendanceController::class, 'getSession']);
        Route::get('/sessions/{sessionId}/attendance', [AttendanceController::class, 'getSessionAttendance']);
        Route::get('/session/{sessionId}', [AttendanceController::class, 'bySession']);
        Route::get('/session/{sessionId}/statistics', [AttendanceController::class, 'statistics']);
        Route::get('/student/{studentId}', [AttendanceController::class, 'byStudent']);
        Route::get('/{id}', [AttendanceController::class, 'show']);
        Route::put('/{id}', [AttendanceController::class, 'update']);
        Route::patch('/{id}', [AttendanceController::class, 'update']);
        Route::delete('/{id}', [AttendanceController::class, 'destroy']);
    });

    // Grades Routes
    Route::prefix('grades')->group(function () {
        Route::get('/', [GradeController::class, 'index']);
        Route::post('/', [GradeController::class, 'store']);
        Route::get('/student/{studentId}', [GradeController::class, 'byStudent']);
        Route::get('/subject/{subjectId}', [GradeController::class, 'bySubject']);
        Route::get('/student/{studentId}/subject/{subjectId}', [GradeController::class, 'studentSubjectGrades']);
        Route::get('/{id}', [GradeController::class, 'show']);
        Route::put('/{id}', [GradeController::class, 'update']);
        Route::patch('/{id}', [GradeController::class, 'update']);
        Route::delete('/{id}', [GradeController::class, 'destroy']);
    });

    // Rooms Routes
    Route::prefix('rooms')->group(function () {
        Route::get('/', [RoomController::class, 'index']);
        Route::post('/', [RoomController::class, 'store']);
        Route::get('/{id}', [RoomController::class, 'show']);
        Route::put('/{id}', [RoomController::class, 'update']);
        Route::patch('/{id}', [RoomController::class, 'update']);
        Route::delete('/{id}', [RoomController::class, 'destroy']);
    });

    // Student Groups Routes
    Route::prefix('student-groups')->group(function () {
        Route::get('/', [StudentGroupController::class, 'index']);
        Route::post('/', [StudentGroupController::class, 'store']);
        Route::post('/create-from-registrations', [StudentGroupController::class, 'createFromRegistrations']);
        Route::post('/auto-create', [StudentGroupController::class, 'autoCreate']);
        Route::post('/auto-assign', [StudentGroupController::class, 'autoAssign']);
        Route::get('/{id}', [StudentGroupController::class, 'show']);
        Route::get('/{id}/students', [StudentGroupController::class, 'getStudents']);
        Route::get('/{id}/available-students', [StudentGroupController::class, 'getAvailableStudents']);
        Route::post('/{id}/students', [StudentGroupController::class, 'addStudent']);
        Route::delete('/{id}/students/{studentId}', [StudentGroupController::class, 'removeStudent']);
        Route::put('/{id}', [StudentGroupController::class, 'update']);
        Route::patch('/{id}', [StudentGroupController::class, 'update']);
        Route::delete('/{id}', [StudentGroupController::class, 'destroy']);
    });

    // Student Enrollments Routes
    Route::prefix('student-enrollments')->group(function () {
        Route::get('/', [StudentEnrollmentController::class, 'index']);
        Route::post('/', [StudentEnrollmentController::class, 'store']);
        Route::get('/student/{studentId}', [StudentEnrollmentController::class, 'byStudent']);
        Route::get('/{id}', [StudentEnrollmentController::class, 'show']);
        Route::put('/{id}', [StudentEnrollmentController::class, 'update']);
        Route::patch('/{id}', [StudentEnrollmentController::class, 'update']);
        Route::delete('/{id}', [StudentEnrollmentController::class, 'destroy']);
    });

    // Student Subject Enrollments Routes
    Route::prefix('student-subject-enrollments')->group(function () {
        Route::get('/', [StudentSubjectEnrollmentController::class, 'index']);
        Route::get('/{id}', [StudentSubjectEnrollmentController::class, 'show']);
    });

    // Class Schedule Routes (Teacher Availability)
    Route::prefix('class-schedules')->group(function () {
        Route::get('/', [ClassScheduleController::class, 'index']);
        Route::post('/', [ClassScheduleController::class, 'store']);
        Route::get('/{id}', [ClassScheduleController::class, 'show']);
        Route::put('/{id}', [ClassScheduleController::class, 'update']);
        Route::patch('/{id}', [ClassScheduleController::class, 'update']);
        Route::delete('/{id}', [ClassScheduleController::class, 'destroy']);
        Route::get('/teacher/{teacherId}', [ClassScheduleController::class, 'getTeacherSchedule']);
        Route::post('/teacher/{teacherId}', [ClassScheduleController::class, 'saveTeacherSchedule']);
    });

    // Timetable Routes
    Route::prefix('timetable')->group(function () {
        Route::get('/entries', [TimetableController::class, 'entries']);
        Route::post('/entries', [TimetableController::class, 'store']);
        Route::get('/entries/{id}', [TimetableController::class, 'show']);
        Route::put('/entries/{id}', [TimetableController::class, 'update']);
        Route::patch('/entries/{id}', [TimetableController::class, 'update']);
        Route::delete('/entries/{id}', [TimetableController::class, 'destroy']);
        Route::get('/group/{groupId}', [TimetableController::class, 'byGroup']);
        Route::get('/teacher/{teacherId}', [TimetableController::class, 'byTeacher']);
        Route::post('/auto-generate', [TimetableController::class, 'autoGenerate']);
        Route::get('/semester/{semesterId}', [TimetableController::class, 'listBySemester']);
    });

    // Time Slots Routes (write operations only - read operations are public)
    Route::prefix('time-slots')->group(function () {
        Route::post('/', [TimeSlotController::class, 'store']);
        Route::put('/{id}', [TimeSlotController::class, 'update']);
        Route::patch('/{id}', [TimeSlotController::class, 'update']);
        Route::delete('/{id}', [TimeSlotController::class, 'destroy']);
    });

    // Teacher Subject Assignments Routes
    Route::prefix('teacher-subjects')->group(function () {
        Route::get('/', [TeacherSubjectController::class, 'index']);
        Route::get('/all', [TeacherSubjectController::class, 'all']);
        Route::post('/', [TeacherSubjectController::class, 'store']);
        Route::get('/{id}', [TeacherSubjectController::class, 'show']);
        Route::put('/{id}', [TeacherSubjectController::class, 'update']);
        Route::patch('/{id}', [TeacherSubjectController::class, 'update']);
        Route::delete('/{id}', [TeacherSubjectController::class, 'destroy']);
    });

    // Student Registrations Routes
    Route::prefix('student-registrations')->group(function () {
        Route::get('/', [StudentRegistrationController::class, 'index']);
        Route::post('/', [StudentRegistrationController::class, 'store']);
        Route::post('/register', [StudentRegistrationController::class, 'register']);
        Route::get('/{id}', [StudentRegistrationController::class, 'show']);
        Route::put('/{id}', [StudentRegistrationController::class, 'update']);
        Route::patch('/{id}', [StudentRegistrationController::class, 'update']);
        Route::delete('/{id}', [StudentRegistrationController::class, 'destroy']);
    });

    // System Settings (protected - update only)
    Route::put('/system-settings', [SystemSettingsController::class, 'update']);
    Route::post('/system-settings/upload-logo', [SystemSettingsController::class, 'uploadLogo']);

    // Accounts routes
    Route::prefix('accounts')->group(function () {
        Route::get('/', [AccountController::class, 'index']);
        Route::get('/tree', [AccountController::class, 'tree']);
        Route::get('/parent-accounts', [AccountController::class, 'getParentAccounts']);
        Route::get('/general-ledger/summary', [AccountController::class, 'generalLedgerSummary']);
        Route::get('/{id}/general-ledger', [AccountController::class, 'generalLedger']);
        Route::post('/', [AccountController::class, 'store']);
        Route::get('/{id}', [AccountController::class, 'show']);
        Route::put('/{id}', [AccountController::class, 'update']);
        Route::patch('/{id}', [AccountController::class, 'update']);
        Route::delete('/{id}', [AccountController::class, 'destroy']);
    });

    // Journal Entries routes
    Route::prefix('journal-entries')->group(function () {
        Route::get('/', [JournalEntryController::class, 'index']);
        Route::post('/', [JournalEntryController::class, 'store']);
        Route::get('/{id}', [JournalEntryController::class, 'show']);
        Route::put('/{id}', [JournalEntryController::class, 'update']);
        Route::patch('/{id}', [JournalEntryController::class, 'update']);
        Route::delete('/{id}', [JournalEntryController::class, 'destroy']);
        Route::post('/{id}/post', [JournalEntryController::class, 'post']);
        Route::post('/{id}/cancel', [JournalEntryController::class, 'cancel']);
    });

    // Account Defaults routes
    Route::prefix('account-defaults')->group(function () {
        Route::get('/', [AccountDefaultController::class, 'index']);
        Route::post('/', [AccountDefaultController::class, 'store']);
        Route::put('/{id}', [AccountDefaultController::class, 'update']);
        Route::delete('/{id}', [AccountDefaultController::class, 'destroy']);
    });

    // Student Invoices routes
    Route::prefix('invoices')->group(function () {
        Route::get('/', [StudentInvoiceController::class, 'index']);
        Route::get('/all', [StudentInvoiceController::class, 'index']);
        Route::get('/basic', [StudentInvoiceController::class, 'basic']);
        Route::get('/statistics', [StudentInvoiceController::class, 'statistics']);
        Route::get('/{id}', [StudentInvoiceController::class, 'show']);
        Route::put('/{id}/status', [StudentInvoiceController::class, 'updateStatus']);
    });

    // Payment Modes routes
    Route::prefix('payment-modes')->group(function () {
        Route::get('/', [PaymentModeController::class, 'index']);
        Route::post('/', [PaymentModeController::class, 'store']);
        Route::get('/{id}', [PaymentModeController::class, 'show']);
        Route::put('/{id}', [PaymentModeController::class, 'update']);
        Route::patch('/{id}', [PaymentModeController::class, 'update']);
        Route::delete('/{id}', [PaymentModeController::class, 'destroy']);
    });

    // Payment Entries routes
    Route::prefix('payment-entries')->group(function () {
        Route::get('/', [PaymentEntryController::class, 'index']);
        Route::post('/', [PaymentEntryController::class, 'store']);
        Route::get('/{id}', [PaymentEntryController::class, 'show']);
        Route::delete('/{id}', [PaymentEntryController::class, 'destroy']);
    });

    // Fee Definitions routes (manager only for write, staff can view)
    Route::prefix('fee-definitions')->group(function () {
        Route::get('/', [FeeDefinitionController::class, 'index'])->middleware('permission:fees,view');
        Route::get('/{id}', [FeeDefinitionController::class, 'show'])->middleware('permission:fees,view');
        Route::post('/', [FeeDefinitionController::class, 'store'])->middleware('permission:fee-structure,create');
        Route::put('/{id}', [FeeDefinitionController::class, 'update'])->middleware('permission:fee-structure,edit');
        Route::patch('/{id}', [FeeDefinitionController::class, 'update'])->middleware('permission:fee-structure,edit');
        Route::delete('/{id}', [FeeDefinitionController::class, 'destroy'])->middleware('permission:fee-structure,delete');
    });

    // Fee Rules routes (manager only for write, staff can view)
    Route::prefix('fee-rules')->group(function () {
        Route::get('/', [FeeRuleController::class, 'index'])->middleware('permission:fees,view');
        Route::get('/applicable', [FeeRuleController::class, 'getApplicableFees'])->middleware('permission:fees,view');
        Route::get('/{id}', [FeeRuleController::class, 'show'])->middleware('permission:fees,view');
        Route::post('/', [FeeRuleController::class, 'store'])->middleware('permission:fee-structure,create');
        Route::put('/{id}', [FeeRuleController::class, 'update'])->middleware('permission:fee-structure,edit');
        Route::patch('/{id}', [FeeRuleController::class, 'update'])->middleware('permission:fee-structure,edit');
        Route::delete('/{id}', [FeeRuleController::class, 'destroy'])->middleware('permission:fee-structure,delete');
    });

    // Fees routes (Student Invoices) - staff can view only, manager can manage
    Route::prefix('fees')->group(function () {
        Route::get('/', [FeeController::class, 'index'])->middleware('permission:fees,view');
        Route::get('/statistics', [FeeController::class, 'statistics'])->middleware('permission:fees,view');
        Route::post('/apply-pending', [FeeController::class, 'applyPendingFees'])->middleware('permission:fees,edit');
        Route::get('/{id}', [FeeController::class, 'show'])->middleware('permission:fees,view');
        Route::post('/{id}/payment', [FeeController::class, 'recordPayment'])->middleware('permission:fees,create');
        Route::post('/{id}/toggle-attendance', [FeeController::class, 'toggleAttendance'])->middleware('permission:fees,edit');
        Route::post('/{id}/discount', [FeeController::class, 'applyDiscount'])->middleware('permission:fees,edit');
        Route::delete('/{id}/discount', [FeeController::class, 'removeDiscount'])->middleware('permission:fees,edit');
    });

    // Roles routes (users permission required)
    Route::prefix('roles')->middleware('permission:users,view')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/available-permissions', [RoleController::class, 'availablePermissions']);
        Route::post('/', [RoleController::class, 'store']);
        Route::get('/{id}', [RoleController::class, 'show']);
        Route::put('/{id}', [RoleController::class, 'update']);
        Route::patch('/{id}', [RoleController::class, 'update']);
        Route::delete('/{id}', [RoleController::class, 'destroy']);
    });

    // User Management routes (users permission required)
    Route::prefix('user-management')->middleware('permission:users,view')->group(function () {
        Route::get('/', [UserManagementController::class, 'index']);
        Route::post('/', [UserManagementController::class, 'store']);
        Route::get('/{id}', [UserManagementController::class, 'show']);
        Route::put('/{id}', [UserManagementController::class, 'update']);
        Route::patch('/{id}', [UserManagementController::class, 'update']);
        Route::delete('/{id}', [UserManagementController::class, 'destroy']);
        Route::post('/{id}/toggle-status', [UserManagementController::class, 'toggleStatus']);
        Route::post('/{id}/reset-password', [UserManagementController::class, 'resetPassword']);
    });

    // Action Logs routes (action-logs view permission required)
    Route::prefix('action-logs')->middleware('permission:action-logs,view')->group(function () {
        Route::get('/', [ActionLogController::class, 'index']);
        Route::get('/statistics', [ActionLogController::class, 'statistics']);
        Route::get('/filters', [ActionLogController::class, 'filters']);
        Route::get('/export', [ActionLogController::class, 'export']);
        Route::get('/{id}', [ActionLogController::class, 'show']);
    });

    // Teacher Portal Routes (teacher role only - scoped to their own data)
    Route::prefix('teacher-portal')->middleware('role:teacher')->group(function () {
        Route::get('/dashboard', [TeacherPortalController::class, 'dashboard']);
        Route::get('/my-subjects', [TeacherPortalController::class, 'mySubjects']);
        Route::get('/my-students', [TeacherPortalController::class, 'myStudents']);
        Route::get('/my-schedule', [TeacherPortalController::class, 'mySchedule']);
        Route::get('/my-attendance', [TeacherPortalController::class, 'myAttendance']);
        Route::get('/subjects/{subjectId}/grades', [TeacherPortalController::class, 'subjectGrades']);
        Route::post('/grades', [TeacherPortalController::class, 'storeGrades']);
        Route::put('/grades/{gradeId}', [TeacherPortalController::class, 'updateGrade']);
        Route::delete('/grades/{gradeId}', [TeacherPortalController::class, 'deleteGrade']);
    });

    // Student Portal Routes (student role only - scoped to their own data)
    Route::prefix('student-portal')->middleware('role:student')->group(function () {
        Route::get('/dashboard', [StudentPortalController::class, 'dashboard']);
        Route::get('/my-subjects', [StudentPortalController::class, 'mySubjects']);
        Route::get('/my-fees', [StudentPortalController::class, 'myFees']);
        Route::get('/my-schedule', [StudentPortalController::class, 'mySchedule']);
        Route::get('/my-grades', [StudentPortalController::class, 'myGrades']);
        Route::get('/my-attendance', [StudentPortalController::class, 'myAttendance']);
        Route::get('/my-profile', [StudentPortalController::class, 'myProfile']);
    });
});
