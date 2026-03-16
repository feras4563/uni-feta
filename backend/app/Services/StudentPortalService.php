<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentSubjectEnrollment;
use App\Models\StudentSemesterRegistration;
use App\Models\TimetableEntry;
use App\Models\ClassSchedule;
use Illuminate\Support\Collection;

class StudentPortalService
{
    /**
     * Resolve student group IDs from registrations (and optionally student_group_members).
     */
    public static function getStudentGroupIds(Student $student): Collection
    {
        $memberGroupIds = collect();

        if (\Schema::hasTable('student_group_members')) {
            $memberGroupIds = \DB::table('student_group_members')
                ->where('student_id', $student->id)
                ->pluck('student_group_id')
                ->filter();
        }

        $registrationGroupIds = StudentSemesterRegistration::where('student_id', $student->id)
            ->whereNotNull('group_id')
            ->pluck('group_id')
            ->filter();

        return $memberGroupIds->merge($registrationGroupIds)->unique()->values();
    }

    /**
     * Resolve enrolled subject IDs (excluding dropped/failed).
     */
    public static function getEnrolledSubjectIds(Student $student): Collection
    {
        return StudentSubjectEnrollment::where('student_id', $student->id)
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereNotIn('status', ['dropped', 'failed']);
            })
            ->pluck('subject_id')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * Build schedule context (group_ids, subject_ids, semester+department pairs, department_ids).
     */
    public static function getScheduleContext(Student $student): array
    {
        $groupIds = self::getStudentGroupIds($student);
        $subjectIds = self::getEnrolledSubjectIds($student);

        $registrationPairs = StudentSemesterRegistration::where('student_id', $student->id)
            ->where(function ($q) {
                $q->whereNull('status')->orWhereNotIn('status', ['withdrawn', 'suspended']);
            })
            ->whereNotNull('semester_id')
            ->get(['semester_id', 'department_id'])
            ->map(fn($r) => ['semester_id' => $r->semester_id, 'department_id' => $r->department_id]);

        $enrollmentPairs = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where(function ($q) {
                $q->whereNull('status')->orWhereNotIn('status', ['dropped', 'failed']);
            })
            ->whereNotNull('semester_id')
            ->get(['semester_id', 'department_id'])
            ->map(fn($r) => ['semester_id' => $r->semester_id, 'department_id' => $r->department_id]);

        $semesterDepartmentPairs = $registrationPairs
            ->merge($enrollmentPairs)
            ->unique(fn($p) => ($p['semester_id'] ?? '') . '|' . ($p['department_id'] ?? ''))
            ->values();

        $departmentIds = $semesterDepartmentPairs->pluck('department_id')->filter()->unique()->values();

        return [
            'group_ids' => $groupIds,
            'subject_ids' => $subjectIds,
            'semester_department_pairs' => $semesterDepartmentPairs,
            'department_ids' => $departmentIds,
        ];
    }

    /**
     * Resolve timetable entries using schedule context.
     */
    public static function getTimetableEntries(array $ctx, ?int $dayOfWeek = null): Collection
    {
        $groupIds = $ctx['group_ids'];
        $subjectIds = $ctx['subject_ids'];
        $pairs = $ctx['semester_department_pairs'];

        if ($groupIds->isEmpty() && $subjectIds->isEmpty() && $pairs->isEmpty()) {
            return collect();
        }

        $query = TimetableEntry::query()->where('is_active', true);

        if ($dayOfWeek !== null) {
            $query->where('day_of_week', $dayOfWeek);
        }

        $query->where(function ($outer) use ($groupIds, $subjectIds, $pairs) {
            $has = false;

            if ($groupIds->isNotEmpty()) {
                $outer->whereIn('group_id', $groupIds);
                $has = true;
            }

            if ($subjectIds->isNotEmpty()) {
                $m = $has ? 'orWhereIn' : 'whereIn';
                $outer->{$m}('subject_id', $subjectIds);
                $has = true;
            }

            if ($pairs->isNotEmpty()) {
                $m = $has ? 'orWhere' : 'where';
                $outer->{$m}(function ($pq) use ($pairs) {
                    foreach ($pairs as $i => $pair) {
                        $pm = $i === 0 ? 'where' : 'orWhere';
                        $pq->{$pm}(function ($inner) use ($pair) {
                            $inner->where('semester_id', $pair['semester_id']);
                            if (!empty($pair['department_id'])) {
                                $inner->where('department_id', $pair['department_id']);
                            }
                        });
                    }
                });
            }
        });

        return $query
            ->with([
                'subject:id,name,name_en,code',
                'teacher:id,name,name_en',
                'room:id,name,code,building',
                'timeSlot:id,code,label,start_time,end_time',
                'studentGroup:id,group_name',
            ])
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->unique('id')
            ->values();
    }

    /**
     * Aggregate student grades into a semester-level summary.
     * Delegates to GradeCalculationService (single source of truth).
     *
     * @return array{total_value: float, total_max: float, percentage: float, gpa: float, letter_grade: array}
     */
    public static function aggregateGrades(Collection $grades): array
    {
        return GradeCalculationService::aggregateGrades($grades);
    }
}
