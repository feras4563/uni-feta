<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Semester;
use App\Models\StudyYear;
use App\Models\TimetableEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ScheduleOverviewController extends Controller
{
    /**
     * Schedule overview showing only timetable entries, filterable by department, teacher, study year, and semester.
     */
    public function overview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department_id'  => 'nullable|exists:departments,id',
            'teacher_id'     => 'nullable|exists:teachers,id',
            'study_year_id'  => 'nullable|exists:study_years,id',
            'semester_id'    => 'nullable|exists:semesters,id',
            'include_inactive' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $includeInactive = $request->boolean('include_inactive', false);

        $timetableQuery = TimetableEntry::query()
            ->with([
                'department:id,name,name_en',
                'teacher:id,name,name_en,department_id',
                'subject:id,name,name_en,code,department_id',
                'studentGroup:id,group_name,department_id',
                'room:id,name,code,building',
                'timeSlot:id,code,label,start_time,end_time',
                'semester:id,name,name_en,study_year_id',
            ]);

        if (!$includeInactive) {
            $timetableQuery->where('is_active', true);
        }

        if ($request->filled('department_id')) {
            $timetableQuery->where('department_id', $request->department_id);
        }

        if ($request->filled('teacher_id')) {
            $timetableQuery->where('teacher_id', $request->teacher_id);
        }

        if ($request->filled('semester_id')) {
            $timetableQuery->where('semester_id', $request->semester_id);
        } elseif ($request->filled('study_year_id')) {
            $semesterIds = Semester::where('study_year_id', $request->study_year_id)->pluck('id');
            $timetableQuery->whereIn('semester_id', $semesterIds);
        }

        $timetableEntries = $timetableQuery
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        $entries = $timetableEntries->map(function (TimetableEntry $entry) {
            return [
                'id'          => 'timetable-' . $entry->id,
                'source_id'   => $entry->id,
                'day_of_week' => $entry->day_of_week,
                'start_time'  => $entry->start_time,
                'end_time'    => $entry->end_time,
                'department'  => $entry->department ? [
                    'id'      => $entry->department->id,
                    'name'    => $entry->department->name,
                    'name_en' => $entry->department->name_en,
                ] : null,
                'teacher' => $entry->teacher ? [
                    'id'            => $entry->teacher->id,
                    'name'          => $entry->teacher->name,
                    'name_en'       => $entry->teacher->name_en,
                    'department_id' => $entry->teacher->department_id,
                ] : null,
                'subject' => $entry->subject ? [
                    'id'            => $entry->subject->id,
                    'name'          => $entry->subject->name,
                    'name_en'       => $entry->subject->name_en,
                    'code'          => $entry->subject->code,
                    'department_id' => $entry->subject->department_id,
                ] : null,
                'student_group' => $entry->studentGroup ? [
                    'id'            => $entry->studentGroup->id,
                    'name'          => $entry->studentGroup->group_name,
                    'department_id' => $entry->studentGroup->department_id,
                ] : null,
                'room' => $entry->room ? [
                    'id'       => $entry->room->id,
                    'name'     => $entry->room->name,
                    'code'     => $entry->room->code,
                    'building' => $entry->room->building,
                ] : null,
                'time_slot' => $entry->timeSlot ? [
                    'id'         => $entry->timeSlot->id,
                    'code'       => $entry->timeSlot->code,
                    'label'      => $entry->timeSlot->label,
                    'start_time' => $entry->timeSlot->start_time,
                    'end_time'   => $entry->timeSlot->end_time,
                ] : null,
                'semester' => $entry->semester ? [
                    'id'           => $entry->semester->id,
                    'name'         => $entry->semester->name,
                    'study_year_id' => $entry->semester->study_year_id,
                ] : null,
            ];
        })->values();

        return response()->json([
            'entries' => $entries,
            'stats'   => [
                'total_entries' => $entries->count(),
            ],
            'filters' => [
                'departments' => Department::query()
                    ->select('id', 'name', 'name_en')
                    ->orderBy('name')
                    ->get(),
                'study_years' => StudyYear::query()
                    ->select('id', 'name', 'name_en')
                    ->orderBy('name')
                    ->get(),
                'semesters' => Semester::query()
                    ->select('id', 'name', 'name_en', 'study_year_id')
                    ->orderBy('name')
                    ->get(),
            ],
        ]);
    }
}
