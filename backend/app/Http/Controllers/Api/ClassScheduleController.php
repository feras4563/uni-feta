<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClassScheduleController extends Controller
{
    /**
     * Get all schedules for a teacher
     */
    public function getTeacherSchedule($teacherId)
    {
        $schedules = ClassSchedule::where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json($schedules);
    }

    /**
     * Save teacher schedule (bulk update)
     */
    public function saveTeacherSchedule(Request $request, $teacherId)
    {
        $validator = Validator::make($request->all(), [
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|integer|between:0,6',
            'schedules.*.start_time' => 'required|date_format:H:i',
            'schedules.*.end_time' => 'required|date_format:H:i|after:schedules.*.start_time',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Delete existing schedules for this teacher
        ClassSchedule::where('teacher_id', $teacherId)->delete();

        // Create new schedules
        $created = [];
        foreach ($request->schedules as $scheduleData) {
            $schedule = ClassSchedule::create([
                'teacher_id' => $teacherId,
                'subject_id' => null, // This is just availability, not a specific class
                'department_id' => null,
                'day_of_week' => $scheduleData['day_of_week'],
                'start_time' => $scheduleData['start_time'],
                'end_time' => $scheduleData['end_time'],
                'is_active' => true,
            ]);
            $created[] = $schedule;
        }

        return response()->json([
            'message' => 'Schedule saved successfully',
            'schedules' => $created
        ], 201);
    }

    /**
     * Get all class schedules
     */
    public function index(Request $request)
    {
        $query = ClassSchedule::with(['teacher', 'subject', 'department']);

        // Filter by teacher
        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by day
        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === true);
        }

        $schedules = $query->orderBy('day_of_week')->orderBy('start_time')->get();

        return response()->json($schedules);
    }

    /**
     * Get a specific schedule
     */
    public function show($id)
    {
        $schedule = ClassSchedule::with(['teacher', 'subject', 'department'])->find($id);

        if (!$schedule) {
            return response()->json([
                'message' => 'Schedule not found'
            ], 404);
        }

        return response()->json($schedule);
    }

    /**
     * Create a new schedule
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|exists:teachers,id',
            'day_of_week' => 'required|integer|between:0,6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'subject_id' => 'nullable|exists:subjects,id',
            'department_id' => 'nullable|exists:departments,id',
            'room' => 'nullable|string|max:100',
            'academic_year' => 'nullable|string|max:20',
            'semester' => 'nullable|in:fall,spring,summer',
            'class_type' => 'nullable|in:lecture,lab,tutorial,seminar',
            'max_students' => 'nullable|integer|min:1',
            'is_recurring' => 'boolean',
            'is_active' => 'boolean',
            'effective_from' => 'nullable|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $schedule = ClassSchedule::create($request->all());
        $schedule->load(['teacher', 'subject', 'department']);

        return response()->json($schedule, 201);
    }

    /**
     * Update a schedule
     */
    public function update(Request $request, $id)
    {
        $schedule = ClassSchedule::find($id);

        if (!$schedule) {
            return response()->json([
                'message' => 'Schedule not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'teacher_id' => 'sometimes|exists:teachers,id',
            'day_of_week' => 'sometimes|integer|between:0,6',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
            'subject_id' => 'nullable|exists:subjects,id',
            'department_id' => 'nullable|exists:departments,id',
            'room' => 'nullable|string|max:100',
            'academic_year' => 'nullable|string|max:20',
            'semester' => 'nullable|in:fall,spring,summer',
            'class_type' => 'nullable|in:lecture,lab,tutorial,seminar',
            'max_students' => 'nullable|integer|min:1',
            'is_recurring' => 'boolean',
            'is_active' => 'boolean',
            'effective_from' => 'nullable|date',
            'effective_to' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $schedule->update($request->all());
        $schedule->load(['teacher', 'subject', 'department']);

        return response()->json($schedule);
    }

    /**
     * Delete a schedule
     */
    public function destroy($id)
    {
        $schedule = ClassSchedule::find($id);

        if (!$schedule) {
            return response()->json([
                'message' => 'Schedule not found'
            ], 404);
        }

        $schedule->delete();

        return response()->json([
            'message' => 'Schedule deleted successfully'
        ]);
    }
}
