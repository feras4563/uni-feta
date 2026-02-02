<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class TeacherController extends Controller
{
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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        
        // Hash password if provided
        if ($request->has('password')) {
            $data['password_hash'] = Hash::make($request->password);
            unset($data['password']);
        }

        $teacher = Teacher::create($data);
        $teacher->load('department:id,name,name_en');

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
        if (isset($teacherData['password'])) {
            $teacherData['password_hash'] = Hash::make($teacherData['password']);
            unset($teacherData['password']);
        }

        // If department_ids provided, use the first one as primary department
        $departmentIds = $request->input('department_ids', []);
        if (!empty($departmentIds)) {
            $teacherData['department_id'] = $departmentIds[0];
        }

        $teacher = Teacher::create($teacherData);
        $teacher->load('department:id,name,name_en');

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
            '08:00' => 'slot1',
            '10:00' => 'slot2',
            '12:00' => 'slot3',
            '14:00' => 'slot4',
            '16:00' => 'slot5',
        ];

        foreach ($schedules as $schedule) {
            $dayName = $dayNames[$schedule->day_of_week] ?? null;
            $slotKey = $timeSlotMap[$schedule->start_time] ?? null;
            
            if ($dayName && $slotKey && isset($availability[$dayName])) {
                $availability[$dayName][$slotKey] = true;
            }
        }

        $teacher->availability = $availability;

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

        return response()->json($teacher);
    }

    /**
     * Remove the specified teacher
     */
    public function destroy($id)
    {
        $teacher = Teacher::findOrFail($id);
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
}
