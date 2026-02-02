<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimetableEntry;
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

        // Check for conflicts
        $conflict = TimetableEntry::where('semester_id', $request->semester_id)
            ->where('day_of_week', $request->day_of_week)
            ->where('is_active', true)
            ->where(function($query) use ($request) {
                // Check if teacher has another class at the same time
                $query->where('teacher_id', $request->teacher_id)
                    ->where(function($q) use ($request) {
                        $q->whereBetween('start_time', [$request->start_time, $request->end_time])
                          ->orWhereBetween('end_time', [$request->start_time, $request->end_time])
                          ->orWhere(function($q2) use ($request) {
                              $q2->where('start_time', '<=', $request->start_time)
                                 ->where('end_time', '>=', $request->end_time);
                          });
                    });
            })
            ->orWhere(function($query) use ($request) {
                // Check if room is occupied at the same time
                if ($request->room_id) {
                    $query->where('room_id', $request->room_id)
                        ->where(function($q) use ($request) {
                            $q->whereBetween('start_time', [$request->start_time, $request->end_time])
                              ->orWhereBetween('end_time', [$request->start_time, $request->end_time])
                              ->orWhere(function($q2) use ($request) {
                                  $q2->where('start_time', '<=', $request->start_time)
                                     ->where('end_time', '>=', $request->end_time);
                              });
                        });
                }
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Schedule conflict detected. Teacher or room is already occupied at this time.'
            ], 409);
        }

        $entry = TimetableEntry::create($request->all());
        $entry->load(['semester', 'department', 'group', 'subject', 'teacher', 'room', 'timeSlot']);

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

        // Get the values to validate (use existing if not provided)
        $teacherId = $request->teacher_id ?? $entry->teacher_id;
        $roomId = $request->room_id ?? $entry->room_id;
        $dayOfWeek = $request->day_of_week ?? $entry->day_of_week;
        $startTime = $request->start_time ?? $entry->start_time;
        $endTime = $request->end_time ?? $entry->end_time;
        $semesterId = $request->semester_id ?? $entry->semester_id;
        
        // Ensure times are in HH:MM format for comparison
        $startTime = substr($startTime, 0, 5);
        $endTime = substr($endTime, 0, 5);

        // Check teacher availability if teacher is being changed or time is being changed
        if ($request->has('teacher_id') || $request->has('day_of_week') || $request->has('start_time') || $request->has('end_time')) {
            $teacherAvailabilities = \App\Models\ClassSchedule::where('teacher_id', $teacherId)
                ->where('day_of_week', $dayOfWeek)
                ->where('is_active', true)
                ->whereNull('subject_id')
                ->get();

            if ($teacherAvailabilities->isEmpty()) {
                return response()->json([
                    'message' => 'المدرس غير متاح في هذا اليوم',
                    'error' => 'teacher_not_available'
                ], 422);
            }

            // Check if teacher is available during this time slot
            $availableDuringSlot = false;
            $availabilityDetails = [];
            
            foreach ($teacherAvailabilities as $availability) {
                $availStart = substr($availability->start_time, 0, 5);
                $availEnd = substr($availability->end_time, 0, 5);
                $availabilityDetails[] = "$availStart - $availEnd";
                
                \Log::info('Checking availability', [
                    'teacher_id' => $teacherId,
                    'day' => $dayOfWeek,
                    'requested' => "$startTime - $endTime",
                    'available' => "$availStart - $availEnd",
                    'matches' => ($availStart <= $startTime && $availEnd >= $endTime)
                ]);
                
                if ($availStart <= $startTime && $availEnd >= $endTime) {
                    $availableDuringSlot = true;
                    break;
                }
            }

            if (!$availableDuringSlot) {
                $availabilityText = implode(', ', $availabilityDetails);
                return response()->json([
                    'message' => "المدرس غير متاح في هذا الوقت. أوقات التوفر: $availabilityText",
                    'error' => 'teacher_not_available_at_time',
                    'requested_time' => "$startTime - $endTime",
                    'available_times' => $availabilityDetails
                ], 422);
            }
        }

        // Check for conflicts (excluding current entry)
        $conflict = TimetableEntry::where('id', '!=', $id)
            ->where('semester_id', $semesterId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->where(function($query) use ($teacherId, $roomId, $entry) {
                $query->where('teacher_id', $teacherId)
                    ->orWhere('group_id', $entry->group_id);
                if ($roomId) {
                    $query->orWhere('room_id', $roomId);
                }
            })
            ->where(function($q) use ($startTime, $endTime) {
                $q->whereBetween('start_time', [$startTime, $endTime])
                  ->orWhereBetween('end_time', [$startTime, $endTime])
                  ->orWhere(function($q2) use ($startTime, $endTime) {
                      $q2->where('start_time', '<=', $startTime)
                         ->where('end_time', '>=', $endTime);
                  });
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'يوجد تعارض في الجدول. المدرس أو القاعة أو المجموعة مشغولة في هذا الوقت',
                'error' => 'schedule_conflict'
            ], 422);
        }

        // Only update fields that are provided in the request
        $updateData = $request->only([
            'teacher_id',
            'room_id',
            'day_of_week',
            'start_time',
            'end_time',
            'notes',
            'is_active'
        ]);
        
        // Remove null values to avoid overwriting existing data
        $updateData = array_filter($updateData, function($value) {
            return $value !== null;
        });
        
        $entry->update($updateData);
        $entry->load(['semester', 'department', 'group', 'subject', 'teacher', 'room', 'timeSlot']);

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
    public function autoGenerate(Request $request)
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

        $semesterId = $request->semester_id;
        $departmentId = $request->department_id;

        // Get all teacher subject assignments for this semester
        $teacherAssignments = \App\Models\TeacherSubject::with([
            'teacher',
            'subject',
            'department'
        ])
        ->where('semester_id', $semesterId);

        if ($departmentId) {
            $teacherAssignments->where('department_id', $departmentId);
        }

        $assignments = $teacherAssignments->get();

        if ($assignments->isEmpty()) {
            return response()->json([
                'message' => 'لا توجد تكليفات للمدرسين في هذا الفصل الدراسي',
                'generated' => 0
            ], 400);
        }

        // Get all student groups for this semester
        $groupsQuery = \App\Models\StudentGroup::where('semester_id', $semesterId)
            ->where('is_active', true);

        if ($departmentId) {
            $groupsQuery->where('department_id', $departmentId);
        }

        $groups = $groupsQuery->get();

        if ($groups->isEmpty()) {
            return response()->json([
                'message' => 'لا توجد مجموعات طلاب في هذا الفصل الدراسي',
                'generated' => 0
            ], 400);
        }

        // Get available rooms
        $rooms = \App\Models\Room::where('is_active', true)->get();

        // Time slots (8 AM to 6 PM, 2-hour slots)
        $timeSlots = [
            ['start' => '08:00', 'end' => '10:00'],
            ['start' => '10:00', 'end' => '12:00'],
            ['start' => '12:00', 'end' => '14:00'],
            ['start' => '14:00', 'end' => '16:00'],
            ['start' => '16:00', 'end' => '18:00'],
        ];

        $daysOfWeek = [0, 1, 2, 3, 4]; // Sunday to Thursday

        $generatedCount = 0;
        $errors = [];

        \Log::info('Starting timetable generation', [
            'semester_id' => $semesterId,
            'department_id' => $departmentId,
            'assignments_count' => $assignments->count(),
            'groups_count' => $groups->count(),
            'rooms_count' => $rooms->count()
        ]);

        // For each group, assign classes
        foreach ($groups as $group) {
            // Get assignments for this group's department
            $groupAssignments = $assignments->where('department_id', $group->department_id);

            \Log::info('Processing group', [
                'group_id' => $group->id,
                'group_name' => $group->name,
                'assignments_count' => $groupAssignments->count()
            ]);

            $dayIndex = 0;
            $slotIndex = 0;

            foreach ($groupAssignments as $assignment) {
                // Calculate how many 2-hour slots needed for this subject
                $weeklyHours = $assignment->subject->weekly_hours ?? 2;
                $slotsNeeded = ceil($weeklyHours / 2); // Each slot is 2 hours
                
                \Log::info('Scheduling subject', [
                    'subject' => $assignment->subject->name,
                    'teacher' => $assignment->teacher->name,
                    'weekly_hours' => $weeklyHours,
                    'slots_needed' => $slotsNeeded
                ]);
                
                // Check if teacher has any availability at all
                $hasAvailability = \App\Models\ClassSchedule::where('teacher_id', $assignment->teacher_id)
                    ->where('is_active', true)
                    ->exists();
                
                if (!$hasAvailability) {
                    $errors[] = "المدرس {$assignment->teacher->name} ليس لديه أوقات متاحة محددة للمادة {$assignment->subject->name}";
                    \Log::warning('Teacher has no availability', [
                        'teacher' => $assignment->teacher->name,
                        'subject' => $assignment->subject->name
                    ]);
                    continue; // Skip this assignment
                }
                
                // Schedule the required number of slots for this subject
                for ($slotCount = 0; $slotCount < $slotsNeeded; $slotCount++) {
                    $scheduled = false;
                    $attempts = 0;
                    $maxAttempts = count($daysOfWeek) * count($timeSlots); // Reset per slot
                    
                    // Try to find a suitable slot
                    while (!$scheduled && $attempts < $maxAttempts) {
                        $attempts++;
                    
                    // Get teacher availability for current day
                    $teacherAvailabilities = \App\Models\ClassSchedule::where('teacher_id', $assignment->teacher_id)
                        ->where('day_of_week', $dayIndex)
                        ->where('is_active', true)
                        ->get();

                    // If no availability for this day, try next day
                    if ($teacherAvailabilities->isEmpty()) {
                        $dayIndex = ($dayIndex + 1) % count($daysOfWeek);
                        $slotIndex = 0;
                        continue;
                    }

                    $timeSlot = $timeSlots[$slotIndex];

                    // Check if teacher is available during this time slot
                    $availableDuringSlot = false;
                    foreach ($teacherAvailabilities as $availability) {
                        // Convert times to HH:MM format for comparison
                        $availStart = substr($availability->start_time, 0, 5);
                        $availEnd = substr($availability->end_time, 0, 5);
                        
                        if ($availStart <= $timeSlot['start'] && $availEnd >= $timeSlot['end']) {
                            $availableDuringSlot = true;
                            break;
                        }
                    }

                    if (!$availableDuringSlot) {
                        $slotIndex = ($slotIndex + 1) % count($timeSlots);
                        if ($slotIndex == 0) {
                            $dayIndex = ($dayIndex + 1) % count($daysOfWeek);
                        }
                        continue;
                    }

                    // Check for conflicts
                    $conflict = TimetableEntry::where('semester_id', $semesterId)
                        ->where('day_of_week', $daysOfWeek[$dayIndex])
                        ->where('is_active', true)
                        ->where(function($query) use ($assignment, $group, $timeSlot) {
                            $query->where('teacher_id', $assignment->teacher_id)
                                ->orWhere('group_id', $group->id);
                        })
                        ->where(function($q) use ($timeSlot) {
                            $q->whereBetween('start_time', [$timeSlot['start'], $timeSlot['end']])
                              ->orWhereBetween('end_time', [$timeSlot['start'], $timeSlot['end']])
                              ->orWhere(function($q2) use ($timeSlot) {
                                  $q2->where('start_time', '<=', $timeSlot['start'])
                                     ->where('end_time', '>=', $timeSlot['end']);
                              });
                        })
                        ->exists();

                    if ($conflict) {
                        $slotIndex = ($slotIndex + 1) % count($timeSlots);
                        if ($slotIndex == 0) {
                            $dayIndex = ($dayIndex + 1) % count($daysOfWeek);
                        }
                        continue;
                    }

                    // Find available room
                    $availableRoom = null;
                    foreach ($rooms as $room) {
                        $roomConflict = TimetableEntry::where('semester_id', $semesterId)
                            ->where('day_of_week', $daysOfWeek[$dayIndex])
                            ->where('room_id', $room->id)
                            ->where('is_active', true)
                            ->where(function($q) use ($timeSlot) {
                                $q->whereBetween('start_time', [$timeSlot['start'], $timeSlot['end']])
                                  ->orWhereBetween('end_time', [$timeSlot['start'], $timeSlot['end']])
                                  ->orWhere(function($q2) use ($timeSlot) {
                                      $q2->where('start_time', '<=', $timeSlot['start'])
                                         ->where('end_time', '>=', $timeSlot['end']);
                                  });
                            })
                            ->exists();

                        if (!$roomConflict) {
                            $availableRoom = $room;
                            break;
                        }
                    }

                    // Create timetable entry
                    try {
                        TimetableEntry::create([
                            'semester_id' => $semesterId,
                            'department_id' => $group->department_id,
                            'group_id' => $group->id,
                            'subject_id' => $assignment->subject_id,
                            'teacher_id' => $assignment->teacher_id,
                            'room_id' => $availableRoom ? $availableRoom->id : null,
                            'day_of_week' => $daysOfWeek[$dayIndex],
                            'start_time' => $timeSlot['start'],
                            'end_time' => $timeSlot['end'],
                            'is_active' => true,
                            'notes' => 'تم إنشاؤه تلقائياً'
                        ]);

                        $generatedCount++;
                        $scheduled = true;
                        
                        \Log::info('Created timetable entry', [
                            'subject' => $assignment->subject->name,
                            'teacher' => $assignment->teacher->name,
                            'day' => $daysOfWeek[$dayIndex],
                            'time' => $timeSlot['start'] . ' - ' . $timeSlot['end']
                        ]);
                    } catch (\Exception $e) {
                        $errors[] = "فشل في إنشاء جدول لـ {$assignment->subject->name}: " . $e->getMessage();
                        \Log::error('Failed to create timetable entry', [
                            'error' => $e->getMessage(),
                            'subject' => $assignment->subject->name
                        ]);
                    }

                    // Move to next slot for next assignment
                    $slotIndex = ($slotIndex + 1) % count($timeSlots);
                    if ($slotIndex == 0) {
                        $dayIndex = ($dayIndex + 1) % count($daysOfWeek);
                    }
                } // End while loop
                
                if (!$scheduled) {
                    $errors[] = "تعذر جدولة {$assignment->subject->name} - لا توجد فترات متاحة";
                    \Log::warning('Could not schedule assignment', [
                        'subject' => $assignment->subject->name,
                        'teacher' => $assignment->teacher->name
                    ]);
                }
                } // End for loop (slots per subject)
            } // End foreach assignment
        } // End foreach group

        return response()->json([
            'message' => "تم إنشاء {$generatedCount} جدول دراسي بنجاح",
            'generated' => $generatedCount,
            'errors' => $errors
        ]);
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
