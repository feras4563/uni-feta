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

        $this->clearOrphanedGroupAssignments($validated['department_id'], $validated['semester_id']);

        $registrations = \App\Models\StudentSemesterRegistration::with('group:id,department_id,semester_id')->where([
            'department_id' => $validated['department_id'],
            'semester_id' => $validated['semester_id'],
        ])->where(function ($query) {
            $query->whereNull('group_id')
                ->orWhereDoesntHave('group');
        })->get()->filter(function ($registration) {
            $group = new \App\Models\StudentGroup([
                'department_id' => $registration->department_id,
                'semester_id' => $registration->semester_id,
            ]);

            $eligibility = $this->resolveGroupEligibility($group, $registration->student_id, $registration);

            if ($eligibility['fee_status'] === 'paid' && !$registration->tuition_paid) {
                $registration->tuition_paid = true;
                $registration->save();
            }

            return $eligibility['can_join_group'];
        })->values();

        if ($registrations->isEmpty()) {
            return response()->json([
                'message' => 'No eligible unassigned students found for this department and semester',
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

        $this->clearOrphanedGroupAssignments($validated['department_id'], $validated['semester_id']);

        // Get available groups with capacity
        $groups = \App\Models\StudentGroup::where([
            'department_id' => $validated['department_id'],
            'semester_id' => $validated['semester_id'],
            'is_active' => true,
        ])->whereRaw('current_students < max_students')->get();

        if ($groups->isEmpty()) {
            return response()->json(['message' => 'No available groups with capacity'], 400);
        }

        $registrations = \App\Models\StudentSemesterRegistration::with('group:id,department_id,semester_id')->where([
            'department_id' => $validated['department_id'],
            'semester_id' => $validated['semester_id'],
        ])->where(function ($query) {
            $query->whereNull('group_id')
                ->orWhereDoesntHave('group');
        })->get()->filter(function ($registration) {
            $group = new \App\Models\StudentGroup([
                'department_id' => $registration->department_id,
                'semester_id' => $registration->semester_id,
            ]);

            $eligibility = $this->resolveGroupEligibility($group, $registration->student_id, $registration);

            if ($eligibility['fee_status'] === 'paid' && !$registration->tuition_paid) {
                $registration->tuition_paid = true;
                $registration->save();
            }

            return $eligibility['can_join_group'];
        })->values();

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

        // Ensure registrations are detached even if FK constraints are missing/disabled.
        DB::table('student_semester_registrations')
            ->where('group_id', $id)
            ->update([
                'group_id' => null,
                'updated_at' => now(),
            ]);
        
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

        $this->clearOrphanedGroupAssignments($group->department_id, $group->semester_id);

        $candidateStudentIds = $this->getCandidateStudentIdsForGroup($group);

        if (empty($candidateStudentIds)) {
            return response()->json([]);
        }

        $registrations = \App\Models\StudentSemesterRegistration::with('group:id,department_id,semester_id')
            ->where('department_id', $group->department_id)
            ->where('semester_id', $group->semester_id)
            ->whereIn('student_id', $candidateStudentIds)
            ->get()
            ->keyBy('student_id');

        $availableStudents = \App\Models\Student::whereIn('id', $candidateStudentIds)
            ->orderBy('name')
            ->get();

        $enriched = $availableStudents->map(function ($student) use ($group, $registrations) {
            $studentData = $student->toArray();
            $eligibility = $this->resolveGroupEligibility($group, $student->id, $registrations->get($student->id));

            $studentData['fee_status'] = $eligibility['fee_status'];
            $studentData['has_admin_override'] = $eligibility['has_admin_override'];
            $studentData['can_join_group'] = $eligibility['can_join_group'];
            $studentData['registration_id'] = $registrations->get($student->id)?->id;

            return $studentData;
        })->values();

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

        $this->clearOrphanedGroupAssignments($group->department_id, $group->semester_id);

        if ($group->current_students >= $group->max_students) {
            return response()->json(['message' => 'المجموعة ممتلئة'], 400);
        }

        $existingReg = \App\Models\StudentSemesterRegistration::with('group:id')
            ->where([
                'student_id' => $validated['student_id'],
                'department_id' => $group->department_id,
                'semester_id' => $group->semester_id,
            ])->first();

        if ($existingReg && $existingReg->group_id && !$existingReg->group) {
            $existingReg->group_id = null;
            $existingReg->save();
            $existingReg->unsetRelation('group');
        }

        if ($existingReg && $existingReg->group_id) {
            return response()->json(['message' => 'الطالب مسجل بالفعل في مجموعة أخرى في هذا الفصل الدراسي'], 409);
        }

        $eligibility = $this->resolveGroupEligibility($group, $validated['student_id'], $existingReg);

        if (!$eligibility['can_join_group']) {
            return response()->json([
                'message' => 'لا يمكن إضافة الطالب إلى المجموعة: الرسوم غير مدفوعة ولا يوجد تجاوز إداري. يرجى دفع الرسوم أولاً أو تفعيل التجاوز الإداري من صفحة الرسوم.',
                'error_code' => 'FEES_NOT_PAID'
            ], 422);
        }

        $registration = $existingReg;

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
                'tuition_paid' => $eligibility['fee_status'] === 'paid',
            ]);
        } elseif ($eligibility['fee_status'] === 'paid' && !$registration->tuition_paid) {
            $registration->tuition_paid = true;
            $registration->save();
        }

        $registration->group_id = $groupId;
        $registration->save();

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

        $registration->group_id = null;
        $registration->save();

        $group->current_students = \App\Models\StudentSemesterRegistration::where('group_id', $groupId)->count();
        $group->save();

        return response()->json(['message' => 'Student removed from group successfully']);
    }

    /**
     * Clear stale registrations that point to deleted groups.
     */
    private function clearOrphanedGroupAssignments(string $departmentId, string $semesterId): void
    {
        \App\Models\StudentSemesterRegistration::where('department_id', $departmentId)
            ->where('semester_id', $semesterId)
            ->whereNotNull('group_id')
            ->whereDoesntHave('group')
            ->update([
                'group_id' => null,
                'updated_at' => now(),
            ]);
    }

    private function getCandidateStudentIdsForGroup(\App\Models\StudentGroup $group): array
    {
        $registrationStudentIds = \App\Models\StudentSemesterRegistration::where('department_id', $group->department_id)
            ->where('semester_id', $group->semester_id)
            ->where(function ($query) {
                $query->whereNull('group_id')
                    ->orWhereDoesntHave('group');
            })
            ->pluck('student_id')
            ->all();

        $enrollmentStudentIds = \App\Models\StudentSubjectEnrollment::where('semester_id', $group->semester_id)
            ->where('department_id', $group->department_id)
            ->pluck('student_id')
            ->all();

        $invoiceStudentIds = \App\Models\StudentInvoice::where('semester_id', $group->semester_id)
            ->where(function ($query) use ($group) {
                $query->where('department_id', $group->department_id)
                    ->orWhereNull('department_id');
            })
            ->where('status', '!=', 'cancelled')
            ->pluck('student_id')
            ->all();

        $studentIds = array_values(array_unique(array_merge(
            $registrationStudentIds,
            $enrollmentStudentIds,
            $invoiceStudentIds
        )));

        if (empty($studentIds)) {
            return [];
        }

        $assignedStudentIds = \App\Models\StudentSemesterRegistration::where('department_id', $group->department_id)
            ->where('semester_id', $group->semester_id)
            ->whereNotNull('group_id')
            ->whereHas('group', function ($query) use ($group) {
                $query->where('department_id', $group->department_id)
                    ->where('semester_id', $group->semester_id);
            })
            ->pluck('student_id')
            ->all();

        return array_values(array_diff($studentIds, $assignedStudentIds));
    }

    private function resolveGroupEligibility(
        \App\Models\StudentGroup $group,
        string $studentId,
        ?\App\Models\StudentSemesterRegistration $registration = null
    ): array {
        $registration = $registration ?: \App\Models\StudentSemesterRegistration::with('group:id,department_id,semester_id')
            ->where('student_id', $studentId)
            ->where('department_id', $group->department_id)
            ->where('semester_id', $group->semester_id)
            ->first();

        $invoice = \App\Models\StudentInvoice::where('student_id', $studentId)
            ->where('semester_id', $group->semester_id)
            ->where(function ($query) use ($group) {
                $query->where('department_id', $group->department_id)
                    ->orWhereNull('department_id');
            })
            ->where('status', '!=', 'cancelled')
            ->orderByRaw("CASE WHEN status = 'paid' THEN 0 WHEN status = 'partial' THEN 1 ELSE 2 END")
            ->orderByDesc('invoice_date')
            ->orderByDesc('created_at')
            ->first();

        $feeStatus = 'unpaid';

        if ($invoice) {
            if ($invoice->status === 'paid' || (float) $invoice->balance <= 0) {
                $feeStatus = 'paid';
            } elseif ($invoice->status === 'partial' || (float) $invoice->paid_amount > 0) {
                $feeStatus = 'partial';
            } elseif (!empty($invoice->status)) {
                $feeStatus = $invoice->status;
            }
        }

        if ($registration && $registration->tuition_paid) {
            $feeStatus = 'paid';
        }

        $paidEnrollmentExists = \App\Models\StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('semester_id', $group->semester_id)
            ->where('department_id', $group->department_id)
            ->where(function ($query) {
                $query->where('payment_status', 'paid')
                    ->orWhere(function ($subQuery) {
                        $subQuery->where('attendance_allowed', true)
                            ->where('admin_override', false);
                    });
            })
            ->exists();

        if ($paidEnrollmentExists) {
            $feeStatus = 'paid';
        }

        $hasAdminOverride = \App\Models\StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('semester_id', $group->semester_id)
            ->where('department_id', $group->department_id)
            ->where('admin_override', true)
            ->where('attendance_allowed', true)
            ->exists();

        return [
            'fee_status' => $feeStatus,
            'has_admin_override' => $hasAdminOverride,
            'can_join_group' => $feeStatus === 'paid' || $hasAdminOverride,
        ];
    }
}
