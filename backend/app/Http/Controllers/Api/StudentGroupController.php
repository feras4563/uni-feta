<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentGroupController extends Controller
{
    /**
     * Get all student groups
     */
    public function index(Request $request)
    {
        $query = \App\Models\StudentGroup::with([
            'department:id,name,name_en',
            'semester:id,name,name_en,code'
        ]);
        
        // Check if pagination is disabled
        $paginate = $request->query('paginate', 'true');
        
        if ($paginate === 'false') {
            $groups = $query->get();
            return response()->json($groups);
        }
        
        // Default pagination
        $perPage = $request->query('per_page', 15);
        $groups = $query->paginate($perPage);
        
        return response()->json($groups);
    }
    
    /**
     * Create a new student group
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'nullable|string',
            'semester_id' => 'nullable|string',
            'semester_number' => 'nullable|integer',
            'max_students' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);
        
        // Map 'name' to 'group_name' for database
        $data = [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'group_name' => $validated['name'],
            'department_id' => $validated['department_id'] ?? null,
            'semester_id' => $validated['semester_id'] ?? null,
            'semester_number' => $validated['semester_number'] ?? 1,
            'max_students' => $validated['max_students'] ?? 30,
            'current_students' => 0,
            'is_active' => true,
            'description' => $validated['description'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        
        DB::table('student_groups')->insert($data);
        $group = DB::table('student_groups')->where('id', $data['id'])->first();
        
        return response()->json($group, 201);
    }
    
    /**
     * Get a specific student group
     */
    public function show($id)
    {
        $group = DB::table('student_groups')->where('id', $id)->first();
        
        if (!$group) {
            return response()->json(['message' => 'Student group not found'], 404);
        }
        
        return response()->json($group);
    }
    
    /**
     * Update a student group
     */
    public function update(Request $request, $id)
    {
        $group = \App\Models\StudentGroup::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'department_id' => 'nullable|string',
            'semester_id' => 'nullable|string',
            'semester_number' => 'nullable|integer',
            'max_students' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);
        
        $data = [];
        if (isset($validated['name'])) $data['group_name'] = $validated['name'];
        if (array_key_exists('department_id', $validated)) $data['department_id'] = $validated['department_id'];
        if (array_key_exists('semester_id', $validated)) $data['semester_id'] = $validated['semester_id'];
        if (isset($validated['semester_number'])) $data['semester_number'] = $validated['semester_number'];
        if (isset($validated['max_students'])) $data['max_students'] = $validated['max_students'];
        if (array_key_exists('description', $validated)) $data['description'] = $validated['description'];
        
        $group->update($data);
        $group->load('department', 'semester');
        
        return response()->json($group);
    }
    
    /**
     * Create groups automatically from registered students
     */
    public function createFromRegistrations(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|string|exists:departments,id',
            'semester_id' => 'required|string|exists:semesters,id',
            'max_students_per_group' => 'required|integer|min:5|max:100',
        ]);
        
        // Get all registered students in this department/semester without a group
        $registrations = \App\Models\StudentSemesterRegistration::where([
            'department_id' => $validated['department_id'],
            'semester_id' => $validated['semester_id'],
        ])->whereNull('group_id')->get();
        
        if ($registrations->isEmpty()) {
            return response()->json([
                'message' => 'No unassigned students found for this department and semester',
                'summary' => ['totalGroups' => 0, 'totalStudents' => 0]
            ]);
        }
        
        $maxPerGroup = $validated['max_students_per_group'];
        $totalStudents = $registrations->count();
        $numGroups = (int) ceil($totalStudents / $maxPerGroup);
        
        // Get department name for group naming
        $department = \App\Models\Department::find($validated['department_id']);
        $deptName = $department ? $department->name : 'مجموعة';
        
        $createdGroups = [];
        $chunks = $registrations->chunk($maxPerGroup);
        
        foreach ($chunks as $index => $chunk) {
            $group = \App\Models\StudentGroup::create([
                'group_name' => $deptName . ' - مجموعة ' . ($index + 1),
                'department_id' => $validated['department_id'],
                'semester_id' => $validated['semester_id'],
                'semester_number' => $chunk->first()->semester_number ?? 1,
                'max_students' => $maxPerGroup,
                'current_students' => $chunk->count(),
                'is_active' => true,
            ]);
            
            // Assign students to this group
            foreach ($chunk as $registration) {
                $registration->group_id = $group->id;
                $registration->save();
            }
            
            $createdGroups[] = $group;
        }
        
        return response()->json([
            'message' => 'Groups created successfully',
            'groups' => $createdGroups,
            'summary' => [
                'totalGroups' => count($createdGroups),
                'totalStudents' => $totalStudents,
            ]
        ]);
    }
    
    /**
     * Auto-create empty groups for a department/semester
     */
    public function autoCreate(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|string|exists:departments,id',
            'semester_id' => 'required|string|exists:semesters,id',
            'groups_per_semester' => 'required|integer|min:1|max:20',
            'max_students' => 'required|integer|min:5|max:100',
        ]);
        
        $department = \App\Models\Department::find($validated['department_id']);
        $deptName = $department ? $department->name : 'مجموعة';
        
        $createdGroups = [];
        for ($i = 1; $i <= $validated['groups_per_semester']; $i++) {
            $group = \App\Models\StudentGroup::create([
                'group_name' => $deptName . ' - مجموعة ' . $i,
                'department_id' => $validated['department_id'],
                'semester_id' => $validated['semester_id'],
                'semester_number' => 1,
                'max_students' => $validated['max_students'],
                'current_students' => 0,
                'is_active' => true,
            ]);
            $createdGroups[] = $group;
        }
        
        return response()->json($createdGroups);
    }
    
    /**
     * Auto-assign unassigned students to existing groups
     */
    public function autoAssign(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|string|exists:departments,id',
            'semester_id' => 'required|string|exists:semesters,id',
        ]);
        
        // Get available groups with capacity
        $groups = \App\Models\StudentGroup::where([
            'department_id' => $validated['department_id'],
            'semester_id' => $validated['semester_id'],
            'is_active' => true,
        ])->whereRaw('current_students < max_students')->get();
        
        if ($groups->isEmpty()) {
            return response()->json(['message' => 'No available groups with capacity'], 400);
        }
        
        // Get unassigned students
        $registrations = \App\Models\StudentSemesterRegistration::where([
            'department_id' => $validated['department_id'],
            'semester_id' => $validated['semester_id'],
        ])->whereNull('group_id')->get();
        
        $assigned = 0;
        $groupIndex = 0;
        
        foreach ($registrations as $registration) {
            // Find next group with capacity
            $attempts = 0;
            while ($attempts < $groups->count()) {
                $group = $groups[$groupIndex % $groups->count()];
                if ($group->current_students < $group->max_students) {
                    $registration->group_id = $group->id;
                    $registration->save();
                    $group->current_students++;
                    $group->save();
                    $assigned++;
                    $groupIndex++;
                    break;
                }
                $groupIndex++;
                $attempts++;
            }
        }
        
        return response()->json([
            'message' => "Assigned $assigned students to groups",
            'assigned' => $assigned,
        ]);
    }
    
    /**
     * Delete a student group
     */
    public function destroy($id)
    {
        $group = DB::table('student_groups')->where('id', $id)->first();
        
        if (!$group) {
            return response()->json(['message' => 'Student group not found'], 404);
        }
        
        DB::table('student_groups')->where('id', $id)->delete();
        
        return response()->json(['message' => 'Student group deleted successfully']);
    }
    
    /**
     * Get students in a specific group
     */
    public function getStudents($id)
    {
        $students = \App\Models\StudentSemesterRegistration::with([
            'student:id,name,name_en,email,national_id_passport,phone',
            'semester:id,name,name_en',
            'department:id,name,name_en'
        ])
        ->where('group_id', $id)
        ->get();
        
        return response()->json($students);
    }
    
    /**
     * Get available students for a group (students in same department/semester without a group)
     * Includes fee payment status for each student
     */
    public function getAvailableStudents($groupId)
    {
        $group = \App\Models\StudentGroup::findOrFail($groupId);
        
        // Get students who are registered in the same department and semester but don't have a group
        $availableStudents = \App\Models\Student::whereHas('semesterRegistrations', function($query) use ($group) {
            $query->where('department_id', $group->department_id)
                  ->where('semester_id', $group->semester_id)
                  ->whereNull('group_id');
        })->get();
        
        // Enrich with fee status
        $enriched = $availableStudents->map(function($student) use ($group) {
            $studentData = $student->toArray();
            
            // Check invoice status
            $invoice = \App\Models\StudentInvoice::where('student_id', $student->id)
                ->where('semester_id', $group->semester_id)
                ->first();
            
            $feeStatus = 'unpaid';
            if ($invoice) {
                $feeStatus = $invoice->status; // paid, partial, pending
            }
            
            // Check tuition_paid on registration
            $reg = \App\Models\StudentSemesterRegistration::where([
                'student_id' => $student->id,
                'department_id' => $group->department_id,
                'semester_id' => $group->semester_id,
            ])->first();
            
            if ($reg && $reg->tuition_paid) {
                $feeStatus = 'paid';
            }
            
            // Check admin override
            $hasAdminOverride = \App\Models\StudentSubjectEnrollment::where('student_id', $student->id)
                ->where('semester_id', $group->semester_id)
                ->where('admin_override', true)
                ->where('attendance_allowed', true)
                ->exists();
            
            $studentData['fee_status'] = $feeStatus;
            $studentData['has_admin_override'] = $hasAdminOverride;
            $studentData['can_join_group'] = ($feeStatus === 'paid' || $hasAdminOverride);
            
            return $studentData;
        });
        
        return response()->json($enriched);
    }
    
    /**
     * Add a student to a group
     */
    public function addStudent(Request $request, $groupId)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'semester_id' => 'nullable|string',
            'department_id' => 'nullable|string',
            'semester_number' => 'nullable|integer',
        ]);
        
        $group = \App\Models\StudentGroup::findOrFail($groupId);
        
        // Check if group is full
        if ($group->current_students >= $group->max_students) {
            return response()->json(['message' => 'المجموعة ممتلئة'], 400);
        }
        
        // Check if student is already in another group for this semester/department
        $existingInGroup = \App\Models\StudentSemesterRegistration::where([
            'student_id' => $validated['student_id'],
            'department_id' => $group->department_id,
            'semester_id' => $group->semester_id,
        ])->whereNotNull('group_id')->first();
        
        if ($existingInGroup) {
            return response()->json(['message' => 'الطالب مسجل بالفعل في مجموعة أخرى في هذا الفصل الدراسي'], 409);
        }
        
        // --- Fee Payment Check ---
        // Check if student has paid fees or has admin override
        $hasPaidFees = false;
        $hasAdminOverride = false;
        
        // 1. Check student invoice for this semester
        $invoice = \App\Models\StudentInvoice::where('student_id', $validated['student_id'])
            ->where('semester_id', $group->semester_id)
            ->first();
        
        if ($invoice && $invoice->status === 'paid') {
            $hasPaidFees = true;
        }
        
        // 2. Check tuition_paid on existing registration
        $existingReg = \App\Models\StudentSemesterRegistration::where([
            'student_id' => $validated['student_id'],
            'department_id' => $group->department_id,
            'semester_id' => $group->semester_id,
        ])->first();
        
        if ($existingReg && $existingReg->tuition_paid) {
            $hasPaidFees = true;
        }
        
        // 3. Check admin_override on subject enrollments
        $adminOverrideExists = \App\Models\StudentSubjectEnrollment::where('student_id', $validated['student_id'])
            ->where('semester_id', $group->semester_id)
            ->where('admin_override', true)
            ->where('attendance_allowed', true)
            ->exists();
        
        if ($adminOverrideExists) {
            $hasAdminOverride = true;
        }
        
        if (!$hasPaidFees && !$hasAdminOverride) {
            return response()->json([
                'message' => 'لا يمكن إضافة الطالب إلى المجموعة: الرسوم غير مدفوعة ولا يوجد تجاوز إداري. يرجى دفع الرسوم أولاً أو تفعيل التجاوز الإداري من صفحة الرسوم.',
                'error_code' => 'FEES_NOT_PAID'
            ], 422);
        }
        // --- End Fee Payment Check ---
        
        // Find the student's semester registration
        $registration = $existingReg;
        
        // If no registration exists, create one
        if (!$registration) {
            $semester = \App\Models\Semester::find($group->semester_id);
            $registration = \App\Models\StudentSemesterRegistration::create([
                'student_id' => $validated['student_id'],
                'department_id' => $group->department_id,
                'semester_id' => $group->semester_id,
                'study_year_id' => $semester->study_year_id ?? \App\Models\StudyYear::first()?->id,
                'semester_number' => $group->semester_number ?? 1,
                'registration_date' => now(),
                'status' => 'active',
            ]);
        }
        
        // Assign to group
        $registration->group_id = $groupId;
        $registration->save();
        
        // Update group count
        $group->current_students = \App\Models\StudentSemesterRegistration::where('group_id', $groupId)->count();
        $group->save();
        
        return response()->json(['message' => 'تم إضافة الطالب إلى المجموعة بنجاح', 'registration' => $registration]);
    }
    
    /**
     * Remove a student from a group
     */
    public function removeStudent($groupId, $studentId)
    {
        $group = \App\Models\StudentGroup::findOrFail($groupId);
        
        // Try finding by registration ID first, then by student_id
        $registration = \App\Models\StudentSemesterRegistration::where('id', $studentId)
            ->where('group_id', $groupId)
            ->first();
        
        if (!$registration) {
            $registration = \App\Models\StudentSemesterRegistration::where([
                'student_id' => $studentId,
                'group_id' => $groupId
            ])->first();
        }
        
        if (!$registration) {
            return response()->json(['message' => 'Student not found in this group'], 404);
        }
        
        // Remove from group
        $registration->group_id = null;
        $registration->save();
        
        // Update group count
        $group->current_students = \App\Models\StudentSemesterRegistration::where('group_id', $groupId)->count();
        $group->save();
        
        return response()->json(['message' => 'Student removed from group successfully']);
    }
}
