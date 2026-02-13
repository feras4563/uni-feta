<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use App\Models\AppUser;
use App\Traits\LogsUserActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class TeacherController extends Controller
{
    use LogsUserActions;
    /**
     * Display a listing of teachers
     */
    public function index(Request $request)
    {
        $query = Teacher::with('department:id,name,name_en');

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('campus_id', 'like', "%{$search}%")
                  ->orWhere('specialization', 'like', "%{$search}%");
            });
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $query->orderBy('name');

        return response()->json($query->get());
    }

    /**
     * Store a newly created teacher
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'email' => 'required|email|unique:teachers,email',
            'phone' => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'username' => 'nullable|string|unique:teachers,username|max:50',
            'password' => 'nullable|string|min:6',
            'is_active' => 'nullable|boolean',
            'qualification' => 'nullable|in:رئيس قسم,محاضر,متعاون',
            'education_level' => 'nullable|string|max:255',
            'credential_institution' => 'nullable|string|max:255',
            'credential_date' => 'nullable|date',
            'years_experience' => 'nullable|integer|min:0|max:50',
            'specializations' => 'nullable|array',
            'teaching_hours' => 'nullable|integer|min:0|max:168',
            'academic_records' => 'nullable|string',
            'basic_salary' => 'nullable|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'bio' => 'nullable|string',
            'office_location' => 'nullable|string|max:255',
            'office_hours' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        
        // Generate default password if not provided
        $rawPassword = $request->password ?? 'password123';
        $data['password_hash'] = Hash::make($rawPassword);
        unset($data['password']);

        // Generate username from email if not provided
        if (empty($data['username'])) {
            $data['username'] = explode('@', $request->email)[0];
            // Ensure uniqueness
            $baseUsername = $data['username'];
            $counter = 1;
            while (Teacher::where('username', $data['username'])->exists()) {
                $data['username'] = $baseUsername . $counter;
                $counter++;
            }
        }

        $teacher = Teacher::create($data);

        // Auto-create login account for the teacher
        $this->createTeacherLoginAccount($teacher, $rawPassword);

        $teacher->load('department:id,name,name_en');

        $this->logAction('create', 'teachers', $teacher->id, [
            'teacher_name' => $teacher->name,
            'department_id' => $teacher->department_id,
        ]);

        return response()->json($teacher, 201);
    }

    /**
     * Store a newly created teacher with department assignments
     */
    public function storeWithDepartments(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'teacher.name' => 'required|string|max:255',
            'teacher.name_en' => 'nullable|string|max:255',
            'teacher.email' => 'required|email|unique:teachers,email',
            'teacher.phone' => 'nullable|string|max:20',
            'teacher.specialization' => 'nullable|string|max:255',
            'teacher.username' => 'nullable|string|unique:teachers,username|max:50',
            'teacher.password' => 'nullable|string|min:6',
            'teacher.is_active' => 'nullable|boolean',
            'department_ids' => 'nullable|array',
            'department_ids.*' => 'exists:departments,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $teacherData = $request->input('teacher');
        
        // Hash password if provided
        $rawPassword = $teacherData['password'] ?? 'password123';
        $teacherData['password_hash'] = Hash::make($rawPassword);
        unset($teacherData['password']);

        // Generate username from email if not provided
        if (empty($teacherData['username']) && !empty($teacherData['email'])) {
            $teacherData['username'] = explode('@', $teacherData['email'])[0];
            $baseUsername = $teacherData['username'];
            $counter = 1;
            while (Teacher::where('username', $teacherData['username'])->exists()) {
                $teacherData['username'] = $baseUsername . $counter;
                $counter++;
            }
        }

        // If department_ids provided, use the first one as primary department
        $departmentIds = $request->input('department_ids', []);
        if (!empty($departmentIds)) {
            $teacherData['department_id'] = $departmentIds[0];
        }

        $teacher = Teacher::create($teacherData);

        // Auto-create login account for the teacher
        $this->createTeacherLoginAccount($teacher, $rawPassword);

        $teacher->load('department:id,name,name_en');

        $this->logAction('create', 'teachers', $teacher->id, [
            'teacher_name' => $teacher->name,
            'department_id' => $teacher->department_id,
            'method' => 'storeWithDepartments',
        ]);

        return response()->json($teacher, 201);
    }

    /**
     * Display the specified teacher
     */
    public function show($id)
    {
        $teacher = Teacher::with([
            'department:id,name,name_en',
            'subjects' => function($q) {
                $q->select('id', 'name', 'code', 'credits', 'teacher_id');
            },
            'teacherSubjects.subject',
            'teacherSubjects.department',
            'teacherSubjects.semester',
            'teacherSubjects.studyYear',
            'classSessions' => function($q) {
                $q->latest()->limit(10);
            },
        ])->findOrFail($id);

        // Load availability from class_schedules
        $schedules = \App\Models\ClassSchedule::where('teacher_id', $id)
            ->whereNull('subject_id')
            ->where('is_active', true)
            ->get();

        // Convert schedules to availability format
        $availability = [
            'sunday' => ['slot1' => false, 'slot2' => false, 'slot3' => false, 'slot4' => false, 'slot5' => false],
            'monday' => ['slot1' => false, 'slot2' => false, 'slot3' => false, 'slot4' => false, 'slot5' => false],
            'tuesday' => ['slot1' => false, 'slot2' => false, 'slot3' => false, 'slot4' => false, 'slot5' => false],
            'wednesday' => ['slot1' => false, 'slot2' => false, 'slot3' => false, 'slot4' => false, 'slot5' => false],
            'thursday' => ['slot1' => false, 'slot2' => false, 'slot3' => false, 'slot4' => false, 'slot5' => false],
        ];

        $dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $timeSlotMap = [
            '08:00:00' => 'slot1',
            '08:00' => 'slot1',
            '10:00:00' => 'slot2',
            '10:00' => 'slot2',
            '12:00:00' => 'slot3',
            '12:00' => 'slot3',
            '14:00:00' => 'slot4',
            '14:00' => 'slot4',
            '16:00:00' => 'slot5',
            '16:00' => 'slot5',
        ];

        foreach ($schedules as $schedule) {
            $dayName = $dayNames[$schedule->day_of_week] ?? null;
            // Normalize time format (remove seconds if present)
            $startTime = substr($schedule->start_time, 0, 5);
            $slotKey = $timeSlotMap[$schedule->start_time] ?? $timeSlotMap[$startTime] ?? null;
            
            if ($dayName && $slotKey && isset($availability[$dayName])) {
                $availability[$dayName][$slotKey] = true;
            }
        }

        // Only set availability if schedules exist, otherwise set to null to show "not specified" message
        $teacher->availability = $schedules->isEmpty() ? null : $availability;

        return response()->json($teacher);
    }

    /**
     * Update the specified teacher
     */
    public function update(Request $request, $id)
    {
        $teacher = Teacher::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'email' => 'sometimes|required|email|unique:teachers,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'username' => 'nullable|string|unique:teachers,username,' . $id . '|max:50',
            'password' => 'nullable|string|min:6',
            'is_active' => 'nullable|boolean',
            'qualification' => 'nullable|in:رئيس قسم,محاضر,متعاون',
            'education_level' => 'nullable|string|max:255',
            'credential_institution' => 'nullable|string|max:255',
            'credential_date' => 'nullable|date',
            'years_experience' => 'nullable|integer|min:0|max:50',
            'specializations' => 'nullable|array',
            'teaching_hours' => 'nullable|integer|min:0|max:168',
            'academic_records' => 'nullable|string',
            'basic_salary' => 'nullable|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'bio' => 'nullable|string',
            'office_location' => 'nullable|string|max:255',
            'office_hours' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except(['availability']);
        
        // Hash password if provided
        if ($request->has('password')) {
            $data['password_hash'] = Hash::make($request->password);
            unset($data['password']);
        }

        $teacher->update($data);
        
        // Handle availability - save to class_schedules table
        if ($request->has('availability')) {
            $availability = $request->availability;
            
            // Delete existing availability schedules for this teacher
            \App\Models\ClassSchedule::where('teacher_id', $id)
                ->whereNull('subject_id')
                ->delete();
            
            // Map day names to day_of_week numbers
            $dayMapping = [
                'sunday' => 0,
                'monday' => 1,
                'tuesday' => 2,
                'wednesday' => 3,
                'thursday' => 4,
                'friday' => 5,
                'saturday' => 6,
            ];
            
            // Time slot mapping
            $slotTimes = [
                'slot1' => ['start' => '08:00', 'end' => '10:00'],
                'slot2' => ['start' => '10:00', 'end' => '12:00'],
                'slot3' => ['start' => '12:00', 'end' => '14:00'],
                'slot4' => ['start' => '14:00', 'end' => '16:00'],
                'slot5' => ['start' => '16:00', 'end' => '18:00'],
            ];
            
            // Create new availability schedules
            foreach ($availability as $day => $slots) {
                if (isset($dayMapping[$day])) {
                    foreach ($slots as $slot => $isAvailable) {
                        if ($isAvailable && isset($slotTimes[$slot])) {
                            \App\Models\ClassSchedule::create([
                                'teacher_id' => $id,
                                'subject_id' => null,
                                'department_id' => null,
                                'day_of_week' => $dayMapping[$day],
                                'start_time' => $slotTimes[$slot]['start'],
                                'end_time' => $slotTimes[$slot]['end'],
                                'academic_year' => date('Y'),
                                'semester' => 'fall',
                                'is_active' => true,
                            ]);
                        }
                    }
                }
            }
        }
        
        $teacher->load('department:id,name,name_en');

        $this->logAction('update', 'teachers', $teacher->id, [
            'teacher_name' => $teacher->name,
            'updated_fields' => array_keys($request->except(['availability'])),
        ]);

        return response()->json($teacher);
    }

    /**
     * Remove the specified teacher
     */
    public function destroy($id)
    {
        $teacher = Teacher::findOrFail($id);

        $this->logAction('delete', 'teachers', $teacher->id, [
            'teacher_name' => $teacher->name,
        ]);

        $teacher->delete();

        return response()->json(['message' => 'Teacher deleted successfully'], 200);
    }

    /**
     * Get teacher's subjects
     */
    public function subjects($id)
    {
        $teacher = Teacher::findOrFail($id);
        $subjects = $teacher->teacherSubjects()
            ->with('subject', 'department')
            ->where('is_active', true)
            ->get();

        return response()->json($subjects);
    }

    /**
     * Get teacher's class sessions
     */
    public function sessions($id, Request $request)
    {
        $teacher = Teacher::findOrFail($id);
        
        $query = $teacher->classSessions()
            ->with('subject:id,name,code', 'department:id,name');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('session_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('session_date', '<=', $request->end_date);
        }

        $query->orderBy('session_date', 'desc');

        return response()->json($query->get());
    }

    /**
     * Get teacher statistics
     */
    public function statistics($id)
    {
        $teacher = Teacher::findOrFail($id);

        $stats = [
            'total_subjects' => $teacher->teacherSubjects()->where('is_active', true)->count(),
            'total_sessions' => $teacher->classSessions()->count(),
            'completed_sessions' => $teacher->classSessions()->where('status', 'completed')->count(),
            'total_grades_given' => $teacher->grades()->count(),
            'total_schedules' => $teacher->classSchedules()->where('is_active', true)->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Upload teacher photo
     */
    public function uploadPhoto(Request $request, $id)
    {
        $teacher = Teacher::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Delete old photo if exists
        if ($teacher->photo_url) {
            $oldPath = str_replace('/storage/', '', $teacher->photo_url);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('photo')->store('teacher-photos', 'public');
        $teacher->update(['photo_url' => '/storage/' . $path]);

        return response()->json([
            'message' => 'تم رفع الصورة بنجاح',
            'photo_url' => '/storage/' . $path,
        ]);
    }

    /**
     * Create a login account (User + AppUser) for a teacher
     */
    private function createTeacherLoginAccount(Teacher $teacher, string $rawPassword): void
    {
        try {
            // Check if a User already exists with this email
            $user = User::where('email', $teacher->email)->first();
            
            if (!$user) {
                $user = User::create([
                    'name' => $teacher->name,
                    'email' => $teacher->email,
                    'password' => Hash::make($rawPassword),
                ]);
            }

            // Check if AppUser already exists
            $appUser = AppUser::where('auth_user_id', $user->id)->first();
            
            if (!$appUser) {
                AppUser::create([
                    'auth_user_id' => $user->id,
                    'email' => $teacher->email,
                    'full_name' => $teacher->name,
                    'role' => 'teacher',
                    'status' => 'active',
                    'teacher_id' => $teacher->id,
                    'department_id' => $teacher->department_id,
                ]);
            } else {
                // Update existing AppUser to link to teacher
                $appUser->update([
                    'role' => 'teacher',
                    'teacher_id' => $teacher->id,
                    'department_id' => $teacher->department_id,
                ]);
            }

            // Link auth_user_id back to teacher
            $teacher->update(['auth_user_id' => $user->id]);

            \Log::info('Teacher login account created', [
                'teacher_id' => $teacher->id,
                'user_id' => $user->id,
                'email' => $teacher->email,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create teacher login account', [
                'teacher_id' => $teacher->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
