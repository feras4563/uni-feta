<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimetableEntry;
use App\Services\ClassSessionGenerationService;
use App\Services\TimetableSchedulingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TimetableController extends Controller
{
    /**
     * Get all timetable entries with optional filters
     */
    public function entries(Request $request)
    {
        $query = TimetableEntry::with([
            'semester',
            'department',
            'group',
            'subject',
            'teacher',
            'room',
            'timeSlot'
        ]);

        // Apply filters
        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('group_id')) {
            $query->where('group_id', $request->group_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('room_id')) {
            $query->where('room_id', $request->room_id);
        }

        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === true);
        }

        // Order by day and time
        $query->orderBy('day_of_week')
              ->orderBy('start_time');

        $entries = $query->get();

        return response()->json($entries);
    }

    /**
     * Get a specific timetable entry
     */
    public function show($id)
    {
        $entry = TimetableEntry::with([
            'semester',
            'department',
            'group',
            'subject',
            'teacher',
            'room',
            'timeSlot'
        ])->find($id);

        if (!$entry) {
            return response()->json([
                'message' => 'Timetable entry not found'
            ], 404);
        }

        return response()->json($entry);
    }

    /**
     * Create a new timetable entry
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'semester_id' => 'required|exists:semesters,id',
            'department_id' => 'required|exists:departments,id',
            'group_id' => 'nullable|exists:student_groups,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'room_id' => 'nullable|exists:rooms,id',
            'time_slot_id' => 'nullable|exists:time_slots,id',
            'day_of_week' => 'required|integer|min:0|max:6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $entryData = $request->all();
        $entryData['start_time'] = substr($entryData['start_time'], 0, 5);
        $entryData['end_time'] = substr($entryData['end_time'], 0, 5);
        $validation = app(TimetableSchedulingService::class)->validateEntry($entryData);

        if (!$validation['is_valid']) {
            $firstError = $validation['errors'][0] ?? null;

            return response()->json([
                'message' => $firstError['message'] ?? 'تعذر حفظ الحصة بسبب قيود الجدولة.',
                'error' => $firstError['code'] ?? 'scheduling_validation_failed',
                'errors' => $validation['errors'],
            ], 422);
        }

        $entry = TimetableEntry::create($entryData);
        $entry->load(['semester', 'department', 'group', 'subject', 'teacher', 'room', 'timeSlot']);

        // Auto-generate date-specific class sessions for this entry within its semester
        app(ClassSessionGenerationService::class)->syncForEntry($entry->id);

        return response()->json($entry, 201);
    }

    /**
     * Update a timetable entry
     */
    public function update(Request $request, $id)
    {
        $entry = TimetableEntry::find($id);

        if (!$entry) {
            return response()->json([
                'message' => 'Timetable entry not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'semester_id' => 'sometimes|exists:semesters,id',
            'department_id' => 'sometimes|exists:departments,id',
            'group_id' => 'nullable|exists:student_groups,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'teacher_id' => 'sometimes|exists:teachers,id',
            'room_id' => 'nullable|exists:rooms,id',
            'time_slot_id' => 'nullable|exists:time_slots,id',
            'day_of_week' => 'sometimes|integer|min:0|max:6',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $entryData = array_merge($entry->only([
            'semester_id',
            'department_id',
            'group_id',
            'subject_id',
            'teacher_id',
            'room_id',
            'time_slot_id',
            'day_of_week',
            'start_time',
            'end_time',
            'is_active',
            'notes',
        ]), $request->all());

        $entryData['start_time'] = substr($entryData['start_time'], 0, 5);
        $entryData['end_time'] = substr($entryData['end_time'], 0, 5);
        $validation = app(TimetableSchedulingService::class)->validateEntry($entryData, $entry);

        if (!$validation['is_valid']) {
            $firstError = $validation['errors'][0] ?? null;

            return response()->json([
                'message' => $firstError['message'] ?? 'تعذر تحديث الحصة بسبب قيود الجدولة.',
                'error' => $firstError['code'] ?? 'scheduling_validation_failed',
                'errors' => $validation['errors'],
            ], 422);
        }

        $updateData = $request->only([
            'semester_id',
            'department_id',
            'group_id',
            'subject_id',
            'teacher_id',
            'room_id',
            'time_slot_id',
            'day_of_week',
            'start_time',
            'end_time',
            'notes',
            'is_active'
        ]);

        $entry->update($updateData);
        $entry->load(['semester', 'department', 'group', 'subject', 'teacher', 'room', 'timeSlot']);

        // Re-sync date-specific class sessions after timetable change
        app(ClassSessionGenerationService::class)->syncForEntry($entry->id);

        return response()->json($entry);
    }

    /**
     * Delete a timetable entry
     */
    public function destroy($id)
    {
        $entry = TimetableEntry::find($id);

        if (!$entry) {
            return response()->json([
                'message' => 'Timetable entry not found'
            ], 404);
        }

        // Cancel all non-completed sessions for this entry before deleting
        \App\Models\ClassSession::where('timetable_id', $entry->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->update([
                'status' => 'cancelled',
                'notes' => \DB::raw("CONCAT(COALESCE(notes, ''), ' | Auto-cancelled: timetable entry deleted')"),
            ]);

        $entry->delete();

        return response()->json([
            'message' => 'Timetable entry deleted successfully'
        ]);
    }

    /**
     * Get timetable for a specific group
     */
    public function byGroup($groupId)
    {
        $group = \App\Models\StudentGroup::with(['department', 'semester'])
            ->findOrFail($groupId);

        $entries = TimetableEntry::with([
            'semester',
            'department',
            'subject',
            'teacher',
            'room',
            'timeSlot'
        ])
        ->where('group_id', $groupId)
        ->where('is_active', true)
        ->orderBy('day_of_week')
        ->orderBy('start_time')
        ->get();

        return response()->json([
            'group' => $group,
            'entries' => $entries
        ]);
    }

    /**
     * Get timetable for a specific teacher
     */
    public function byTeacher($teacherId)
    {
        $entries = TimetableEntry::with([
            'semester',
            'department',
            'group',
            'subject',
            'room',
            'timeSlot'
        ])
        ->where('teacher_id', $teacherId)
        ->where('is_active', true)
        ->orderBy('day_of_week')
        ->orderBy('start_time')
        ->get();

        return response()->json($entries);
    }

    /**
     * Auto-generate timetable for a semester
     */
    public function autoGenerate(Request $request, TimetableSchedulingService $schedulingService)
    {
        $validator = Validator::make($request->all(), [
            'semester_id' => 'required|exists:semesters,id',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        return response()->json(
            $schedulingService->autoGenerate($request->semester_id, $request->department_id)
        );
    }

    /**
     * Get list of timetables grouped by semester and group
     */
    public function listBySemester($semesterId)
    {
        $groups = \App\Models\StudentGroup::where('semester_id', $semesterId)
            ->where('is_active', true)
            ->with(['department', 'semester'])
            ->get();

        $timetables = [];

        foreach ($groups as $group) {
            $entries = TimetableEntry::with([
                'subject',
                'teacher',
                'room'
            ])
            ->where('group_id', $group->id)
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

            if ($entries->isNotEmpty()) {
                $timetables[] = [
                    'group' => $group,
                    'entries' => $entries
                ];
            }
        }

        return response()->json($timetables);
    }
}
