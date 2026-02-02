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
            'department_id' => 'nullable|integer',
            'year' => 'nullable|integer',
            'semester' => 'nullable|integer',
            'capacity' => 'nullable|integer',
        ]);
        
        $id = DB::table('student_groups')->insertGetId($validated);
        $group = DB::table('student_groups')->where('id', $id)->first();
        
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
        $group = DB::table('student_groups')->where('id', $id)->first();
        
        if (!$group) {
            return response()->json(['message' => 'Student group not found'], 404);
        }
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'department_id' => 'nullable|integer',
            'year' => 'nullable|integer',
            'semester' => 'nullable|integer',
            'capacity' => 'nullable|integer',
        ]);
        
        DB::table('student_groups')->where('id', $id)->update($validated);
        $group = DB::table('student_groups')->where('id', $id)->first();
        
        return response()->json($group);
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
        
        return response()->json($availableStudents);
    }
    
    /**
     * Add a student to a group
     */
    public function addStudent(Request $request, $groupId)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id'
        ]);
        
        $group = \App\Models\StudentGroup::findOrFail($groupId);
        
        // Find the student's semester registration
        $registration = \App\Models\StudentSemesterRegistration::where([
            'student_id' => $validated['student_id'],
            'department_id' => $group->department_id,
            'semester_id' => $group->semester_id
        ])->first();
        
        if (!$registration) {
            return response()->json(['message' => 'Student registration not found for this department and semester'], 404);
        }
        
        // Assign to group
        $registration->group_id = $groupId;
        $registration->save();
        
        // Update group count
        $group->current_students = \App\Models\StudentSemesterRegistration::where('group_id', $groupId)->count();
        $group->save();
        
        return response()->json(['message' => 'Student added to group successfully', 'registration' => $registration]);
    }
    
    /**
     * Remove a student from a group
     */
    public function removeStudent($groupId, $studentId)
    {
        $group = \App\Models\StudentGroup::findOrFail($groupId);
        
        // Find the student's semester registration
        $registration = \App\Models\StudentSemesterRegistration::where([
            'student_id' => $studentId,
            'group_id' => $groupId
        ])->first();
        
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
