<?php

namespace App\Services;

use App\Models\ClassSchedule;
use App\Models\Holiday;
use App\Models\Room;
use App\Models\Semester;
use App\Models\StudentGroup;
use App\Models\TeacherSubject;
use App\Models\TimetableEntry;
use App\Models\TimeSlot;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TimetableSchedulingService
{
    private ClassSessionGenerationService $classSessionGenerationService;

    private const DEFAULT_TIME_SLOTS = [
        ['start' => '08:00', 'end' => '10:00'],
        ['start' => '10:00', 'end' => '12:00'],
        ['start' => '12:00', 'end' => '14:00'],
        ['start' => '14:00', 'end' => '16:00'],
        ['start' => '16:00', 'end' => '18:00'],
    ];

    private const DEFAULT_DAYS = [0, 1, 2, 3, 4];

    public function __construct(ClassSessionGenerationService $classSessionGenerationService)
    {
        $this->classSessionGenerationService = $classSessionGenerationService;
    }

    public function validateEntry(array $payload, ?TimetableEntry $ignoreEntry = null): array
    {
        $dayOfWeek = (int) $payload['day_of_week'];
        $startTime = $this->normalizeTime($payload['start_time']);
        $endTime = $this->normalizeTime($payload['end_time']);

        $entries = TimetableEntry::query()
            ->where('semester_id', $payload['semester_id'])
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->when($ignoreEntry, function ($query) use ($ignoreEntry) {
                $query->where('id', '!=', $ignoreEntry->id);
            })
            ->get();

        $semester = Semester::find($payload['semester_id']);
        $dayStats = $semester ? $this->buildTeachingDayStats($semester) : [];
        $availability = $this->getTeacherAvailabilityWindows($payload['teacher_id'], $dayOfWeek);
        $room = !empty($payload['room_id']) ? Room::find($payload['room_id']) : null;
        $group = !empty($payload['group_id']) ? StudentGroup::withCount('studentSemesterRegistrations')->find($payload['group_id']) : null;

        $errors = [];

        if ($availability->isEmpty()) {
            $errors[] = [
                'code' => 'teacher_day_unavailable',
                'message' => 'المدرس لا يملك أي أوقات متاحة في هذا اليوم.',
            ];
        } elseif (!$this->isWithinAvailability($availability, $startTime, $endTime)) {
            $errors[] = [
                'code' => 'teacher_time_unavailable',
                'message' => 'الوقت المطلوب خارج نطاق توافر المدرس المحدد.',
                'available_times' => $availability
                    ->map(fn (ClassSchedule $slot) => $this->normalizeTime($slot->start_time) . ' - ' . $this->normalizeTime($slot->end_time))
                    ->values()
                    ->all(),
            ];
        }

        if ($semester && (($dayStats[$dayOfWeek]['teaching_days'] ?? 0) === 0)) {
            $errors[] = [
                'code' => 'day_blocked_by_holidays',
                'message' => 'هذا اليوم لا يحتوي على أي أسابيع تدريس فعلية داخل الفصل بعد استبعاد العطل.',
            ];
        }

        if (!empty($payload['time_slot_id'])) {
            $timeSlot = TimeSlot::find($payload['time_slot_id']);
            if ($timeSlot) {
                $slotStart = $this->normalizeTime($timeSlot->start_time);
                $slotEnd = $this->normalizeTime($timeSlot->end_time);
                if ($slotStart !== $startTime || $slotEnd !== $endTime) {
                    $errors[] = [
                        'code' => 'time_slot_mismatch',
                        'message' => 'الفترة الزمنية المختارة لا تطابق وقت البداية والنهاية المدخل.',
                    ];
                }
            }
        }

        foreach ($this->collectConflictTypes($entries, [
            'teacher_id' => $payload['teacher_id'] ?? null,
            'group_id' => $payload['group_id'] ?? null,
            'room_id' => $payload['room_id'] ?? null,
            'day_of_week' => $dayOfWeek,
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]) as $conflictCode) {
            $errors[] = [
                'code' => $conflictCode,
                'message' => match ($conflictCode) {
                    'teacher_conflict' => 'المدرس مرتبط بمحاضرة أخرى في هذا الوقت.',
                    'group_conflict' => 'المجموعة الطلابية لديها محاضرة أخرى في هذا الوقت.',
                    'room_conflict' => 'القاعة مستخدمة في هذا الوقت.',
                    default => 'يوجد تعارض في الجدول.',
                },
            ];
        }

        if ($room && $group) {
            $groupSize = max((int) ($group->current_students ?? 0), (int) ($group->student_semester_registrations_count ?? 0));
            if ($groupSize > 0 && $room->capacity < $groupSize) {
                $errors[] = [
                    'code' => 'room_capacity_insufficient',
                    'message' => 'سعة القاعة أقل من عدد طلاب المجموعة.',
                ];
            }
        }

        return [
            'is_valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    public function autoGenerate(string $semesterId, ?string $departmentId = null): array
    {
        $semester = Semester::findOrFail($semesterId);

        $assignmentsQuery = TeacherSubject::with([
            'teacher:id,name',
            'subject:id,name,weekly_hours,practical_hours,subject_type',
            'department:id,name',
        ])
            ->where('semester_id', $semesterId)
            ->where('is_active', true);

        if ($departmentId) {
            $assignmentsQuery->where('department_id', $departmentId);
        }

        $assignments = $assignmentsQuery->get();

        if ($assignments->isEmpty()) {
            return [
                'message' => 'لا توجد تكليفات نشطة للمدرسين في هذا الفصل الدراسي.',
                'generated' => 0,
                'errors' => [],
            ];
        }

        $groupsQuery = StudentGroup::withCount('studentSemesterRegistrations')
            ->where('semester_id', $semesterId)
            ->where('is_active', true);

        if ($departmentId) {
            $groupsQuery->where('department_id', $departmentId);
        }

        $groups = $groupsQuery->get();

        if ($groups->isEmpty()) {
            return [
                'message' => 'لا توجد مجموعات طلاب نشطة في هذا الفصل الدراسي.',
                'generated' => 0,
                'errors' => [],
            ];
        }

        $rooms = Room::query()
            ->where('is_active', true)
            ->get();

        $timeSlots = $this->resolveCandidateTimeSlots();
        $dayStats = $this->buildTeachingDayStats($semester);
        $existingEntries = TimetableEntry::query()
            ->where('semester_id', $semesterId)
            ->where('is_active', true)
            ->get();

        $generatedCount = 0;
        $errors = [];
        $roomlessAllowed = $rooms->isEmpty();

        DB::transaction(function () use (
            $groups,
            $assignments,
            $rooms,
            $timeSlots,
            $dayStats,
            $semesterId,
            $departmentId,
            &$existingEntries,
            &$generatedCount,
            &$errors,
            $roomlessAllowed
        ) {
            foreach ($groups as $group) {
                $groupAssignments = $assignments
                    ->where('department_id', $group->department_id)
                    ->sortByDesc(function (TeacherSubject $assignment) {
                        return (int) ($assignment->subject->weekly_hours ?? 2);
                    })
                    ->sortBy(function (TeacherSubject $assignment) {
                        return $this->countTeacherAvailabilityCoverage($assignment->teacher_id);
                    })
                    ->values();

                foreach ($groupAssignments as $assignment) {
                    $weeklyHours = max(2, (int) ($assignment->subject->weekly_hours ?? 2));
                    $slotsNeeded = (int) ceil($weeklyHours / 2);

                    $existingForSubject = $existingEntries
                        ->where('group_id', $group->id)
                        ->where('subject_id', $assignment->subject_id)
                        ->count();

                    $remainingSlots = max(0, $slotsNeeded - $existingForSubject);

                    if ($remainingSlots === 0) {
                        continue;
                    }

                    for ($i = 0; $i < $remainingSlots; $i++) {
                        $candidateResult = $this->findBestCandidate(
                            $assignment,
                            $group,
                            $existingEntries,
                            $rooms,
                            $timeSlots,
                            $dayStats,
                            $roomlessAllowed
                        );

                        if (!$candidateResult['candidate']) {
                            $errors[] = $this->formatUnscheduledMessage($assignment, $group, $candidateResult['reason_counts']);
                            continue;
                        }

                        $candidate = $candidateResult['candidate'];
                        $entry = TimetableEntry::create([
                            'semester_id' => $semesterId,
                            'department_id' => $departmentId ?: $group->department_id,
                            'group_id' => $group->id,
                            'subject_id' => $assignment->subject_id,
                            'teacher_id' => $assignment->teacher_id,
                            'room_id' => $candidate['room_id'],
                            'time_slot_id' => $candidate['time_slot_id'],
                            'day_of_week' => $candidate['day_of_week'],
                            'start_time' => $candidate['start_time'],
                            'end_time' => $candidate['end_time'],
                            'is_active' => true,
                            'notes' => 'تم إنشاؤه تلقائياً بواسطة المجدول الذكي',
                        ]);

                        $existingEntries->push($entry);
                        $generatedCount++;
                    }
                }
            }
        });

        $sessionSyncResult = $this->classSessionGenerationService->syncForSemester($semesterId);
        $message = $generatedCount > 0
            ? "تم إنشاء {$generatedCount} حصة في الجدول بنجاح"
            : 'لم يتم إنشاء أي حصص جديدة. راجع أسباب التعذر أدناه.';

        return [
            'message' => $message,
            'generated' => $generatedCount,
            'errors' => array_values(array_unique($errors)),
            'session_sync' => $sessionSyncResult,
        ];
    }

    private function findBestCandidate(
        TeacherSubject $assignment,
        StudentGroup $group,
        Collection $existingEntries,
        Collection $rooms,
        array $timeSlots,
        array $dayStats,
        bool $roomlessAllowed
    ): array {
        $bestCandidate = null;
        $bestScore = null;
        $reasonCounts = [];
        $days = $this->resolveSchedulingDays($dayStats);

        foreach ($days as $dayOfWeek) {
            $availability = $this->getTeacherAvailabilityWindows($assignment->teacher_id, $dayOfWeek);

            if ($availability->isEmpty()) {
                $reasonCounts['teacher_day_unavailable'] = ($reasonCounts['teacher_day_unavailable'] ?? 0) + 1;
                continue;
            }

            if (($dayStats[$dayOfWeek]['teaching_days'] ?? 0) === 0) {
                $reasonCounts['day_blocked_by_holidays'] = ($reasonCounts['day_blocked_by_holidays'] ?? 0) + 1;
                continue;
            }

            foreach ($timeSlots as $index => $timeSlot) {
                $startTime = $this->normalizeTime($timeSlot['start']);
                $endTime = $this->normalizeTime($timeSlot['end']);

                if (!$this->isWithinAvailability($availability, $startTime, $endTime)) {
                    $reasonCounts['teacher_time_unavailable'] = ($reasonCounts['teacher_time_unavailable'] ?? 0) + 1;
                    continue;
                }

                $candidate = [
                    'teacher_id' => $assignment->teacher_id,
                    'group_id' => $group->id,
                    'day_of_week' => $dayOfWeek,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'room_id' => null,
                    'time_slot_id' => $timeSlot['time_slot_id'] ?? null,
                ];

                $conflicts = $this->collectConflictTypes($existingEntries, $candidate);
                if (!empty($conflicts)) {
                    foreach ($conflicts as $conflict) {
                        $reasonCounts[$conflict] = ($reasonCounts[$conflict] ?? 0) + 1;
                    }
                    continue;
                }

                $roomSelection = $this->selectBestRoom($assignment, $group, $candidate, $rooms, $existingEntries, $roomlessAllowed);
                if (!$roomSelection['ok']) {
                    $reasonCounts[$roomSelection['reason']] = ($reasonCounts[$roomSelection['reason']] ?? 0) + 1;
                    continue;
                }

                $candidate['room_id'] = $roomSelection['room_id'];
                $score = $this->scoreCandidate(
                    $candidate,
                    $assignment,
                    $group,
                    $existingEntries,
                    $dayStats,
                    $index,
                    $roomSelection['room']
                );

                if ($bestScore === null || $score > $bestScore) {
                    $bestScore = $score;
                    $bestCandidate = $candidate;
                }
            }
        }

        return [
            'candidate' => $bestCandidate,
            'reason_counts' => $reasonCounts,
        ];
    }

    private function selectBestRoom(
        TeacherSubject $assignment,
        StudentGroup $group,
        array $candidate,
        Collection $rooms,
        Collection $existingEntries,
        bool $roomlessAllowed
    ): array {
        if ($rooms->isEmpty()) {
            return [
                'ok' => $roomlessAllowed,
                'reason' => 'room_unavailable',
                'room_id' => null,
                'room' => null,
            ];
        }

        $groupSize = max((int) ($group->current_students ?? 0), (int) ($group->student_semester_registrations_count ?? 0));
        $preferredRoomType = ((int) ($assignment->subject->practical_hours ?? 0) > 0) ? 'lab' : null;

        $availableRooms = $rooms
            ->filter(function (Room $room) use ($candidate, $existingEntries, $groupSize) {
                if ($groupSize > 0 && $room->capacity < $groupSize) {
                    return false;
                }

                return !$this->hasRoomConflict($existingEntries, $room->id, $candidate['day_of_week'], $candidate['start_time'], $candidate['end_time']);
            })
            ->sortBy(function (Room $room) use ($groupSize, $preferredRoomType) {
                $typePenalty = ($preferredRoomType && $room->room_type !== $preferredRoomType) ? 1000 : 0;
                $capacityWaste = $groupSize > 0 ? max(0, $room->capacity - $groupSize) : $room->capacity;

                return $typePenalty + $capacityWaste;
            })
            ->values();

        if ($availableRooms->isEmpty()) {
            return [
                'ok' => false,
                'reason' => 'room_unavailable',
                'room_id' => null,
                'room' => null,
            ];
        }

        $room = $availableRooms->first();

        return [
            'ok' => true,
            'reason' => null,
            'room_id' => $room->id,
            'room' => $room,
        ];
    }

    private function scoreCandidate(
        array $candidate,
        TeacherSubject $assignment,
        StudentGroup $group,
        Collection $existingEntries,
        array $dayStats,
        int $slotIndex,
        ?Room $room
    ): int {
        $groupDayEntries = $existingEntries
            ->where('group_id', $group->id)
            ->where('day_of_week', $candidate['day_of_week']);

        $teacherDayEntries = $existingEntries
            ->where('teacher_id', $assignment->teacher_id)
            ->where('day_of_week', $candidate['day_of_week']);

        $sameSubjectDayEntries = $groupDayEntries
            ->where('subject_id', $assignment->subject_id)
            ->count();

        $groupAdjacent = $groupDayEntries->contains(function (TimetableEntry $entry) use ($candidate) {
            return $this->normalizeTime($entry->end_time) === $candidate['start_time']
                || $this->normalizeTime($entry->start_time) === $candidate['end_time'];
        });

        $teacherAdjacent = $teacherDayEntries->contains(function (TimetableEntry $entry) use ($candidate) {
            return $this->normalizeTime($entry->end_time) === $candidate['start_time']
                || $this->normalizeTime($entry->start_time) === $candidate['end_time'];
        });

        $holidayPenalty = (int) ($dayStats[$candidate['day_of_week']]['holiday_dates'] ?? 0);
        $groupSize = max((int) ($group->current_students ?? 0), (int) ($group->student_semester_registrations_count ?? 0));
        $roomWastePenalty = ($room && $groupSize > 0) ? (int) floor(max(0, $room->capacity - $groupSize) / 5) : 0;
        $preferredRoomBonus = ($room && (int) ($assignment->subject->practical_hours ?? 0) > 0 && $room->room_type === 'lab') ? 40 : 0;

        return 1000
            - ($groupDayEntries->count() * 120)
            - ($teacherDayEntries->count() * 90)
            - ($sameSubjectDayEntries * 250)
            - ($groupAdjacent ? 25 : 0)
            - ($teacherAdjacent ? 15 : 0)
            - ($holidayPenalty * 3)
            - ($slotIndex * 8)
            - $roomWastePenalty
            + $preferredRoomBonus;
    }

    private function collectConflictTypes(Collection $entries, array $candidate): array
    {
        $conflicts = [];

        foreach ($entries as $entry) {
            if ((int) $entry->day_of_week !== (int) $candidate['day_of_week']) {
                continue;
            }

            if (!$this->timesOverlap(
                $this->normalizeTime($entry->start_time),
                $this->normalizeTime($entry->end_time),
                $candidate['start_time'],
                $candidate['end_time']
            )) {
                continue;
            }

            if (!empty($candidate['teacher_id']) && $entry->teacher_id === $candidate['teacher_id']) {
                $conflicts['teacher_conflict'] = 'teacher_conflict';
            }

            if (!empty($candidate['group_id']) && $entry->group_id === $candidate['group_id']) {
                $conflicts['group_conflict'] = 'group_conflict';
            }

            if (!empty($candidate['room_id']) && $entry->room_id === $candidate['room_id']) {
                $conflicts['room_conflict'] = 'room_conflict';
            }
        }

        return array_values($conflicts);
    }

    private function hasRoomConflict(Collection $entries, string $roomId, int $dayOfWeek, string $startTime, string $endTime): bool
    {
        return $entries->contains(function (TimetableEntry $entry) use ($roomId, $dayOfWeek, $startTime, $endTime) {
            return $entry->room_id === $roomId
                && (int) $entry->day_of_week === $dayOfWeek
                && $this->timesOverlap(
                    $this->normalizeTime($entry->start_time),
                    $this->normalizeTime($entry->end_time),
                    $startTime,
                    $endTime
                );
        });
    }

    private function getTeacherAvailabilityWindows(string $teacherId, int $dayOfWeek): Collection
    {
        return ClassSchedule::query()
            ->where('teacher_id', $teacherId)
            ->whereNull('subject_id')
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->orderBy('start_time')
            ->get();
    }

    private function isWithinAvailability(Collection $availability, string $startTime, string $endTime): bool
    {
        return $availability->contains(function (ClassSchedule $slot) use ($startTime, $endTime) {
            $availabilityStart = $this->normalizeTime($slot->start_time);
            $availabilityEnd = $this->normalizeTime($slot->end_time);

            return $availabilityStart <= $startTime && $availabilityEnd >= $endTime;
        });
    }

    private function timesOverlap(string $existingStart, string $existingEnd, string $candidateStart, string $candidateEnd): bool
    {
        return $existingStart < $candidateEnd && $existingEnd > $candidateStart;
    }

    private function resolveCandidateTimeSlots(): array
    {
        $configuredSlots = TimeSlot::query()
            ->where('is_active', true)
            ->orderBy('start_time')
            ->get(['id', 'start_time', 'end_time']);

        if ($configuredSlots->isEmpty()) {
            return array_map(function (array $slot) {
                return [
                    'time_slot_id' => null,
                    'start' => $slot['start'],
                    'end' => $slot['end'],
                ];
            }, self::DEFAULT_TIME_SLOTS);
        }

        return $configuredSlots
            ->unique(fn ($slot) => $this->normalizeTime($slot->start_time) . '|' . $this->normalizeTime($slot->end_time))
            ->map(function (TimeSlot $slot) {
                return [
                    'time_slot_id' => $slot->id,
                    'start' => $this->normalizeTime($slot->start_time),
                    'end' => $this->normalizeTime($slot->end_time),
                ];
            })
            ->values()
            ->all();
    }

    private function resolveSchedulingDays(array $dayStats): array
    {
        $days = array_keys($dayStats);
        sort($days);

        return !empty($days) ? $days : self::DEFAULT_DAYS;
    }

    private function buildTeachingDayStats(Semester $semester): array
    {
        $holidayDates = $this->buildHolidayDateSet(
            Holiday::all(),
            Carbon::parse($semester->start_date)->startOfDay(),
            Carbon::parse($semester->end_date)->startOfDay()
        );

        $stats = [];
        foreach (range(0, 6) as $day) {
            $stats[$day] = [
                'teaching_days' => 0,
                'holiday_dates' => 0,
            ];
        }

        $cursor = Carbon::parse($semester->start_date)->startOfDay();
        $end = Carbon::parse($semester->end_date)->startOfDay();

        while ($cursor->lte($end)) {
            $day = (int) $cursor->dayOfWeek;
            $dateKey = $cursor->toDateString();

            if (isset($holidayDates[$dateKey])) {
                $stats[$day]['holiday_dates']++;
            } else {
                $stats[$day]['teaching_days']++;
            }

            $cursor->addDay();
        }

        return $stats;
    }

    private function buildHolidayDateSet(Collection $holidays, Carbon $semesterStart, Carbon $semesterEnd): array
    {
        return $this->classSessionGenerationService->buildHolidayDateSet($holidays, $semesterStart, $semesterEnd);
    }

    private function countTeacherAvailabilityCoverage(string $teacherId): int
    {
        return ClassSchedule::query()
            ->where('teacher_id', $teacherId)
            ->whereNull('subject_id')
            ->where('is_active', true)
            ->count();
    }

    private function formatUnscheduledMessage(TeacherSubject $assignment, StudentGroup $group, array $reasonCounts): string
    {
        arsort($reasonCounts);
        $topReasons = array_slice(array_keys($reasonCounts), 0, 3);
        $translatedReasons = array_map(function (string $reason) {
            return match ($reason) {
                'teacher_day_unavailable' => 'لا يوجد توافر للمدرس في الأيام المناسبة',
                'teacher_time_unavailable' => 'فترات التوافر الحالية لا تغطي الفترات الزمنية المطلوبة',
                'teacher_conflict' => 'تعارض مع جدول المدرس الحالي',
                'group_conflict' => 'تعارض مع جدول المجموعة الطلابية',
                'room_conflict' => 'تعارض في القاعة',
                'room_unavailable' => 'لا توجد قاعة مناسبة ومتاحة',
                'day_blocked_by_holidays' => 'اليوم غير صالح بسبب العطل داخل الفصل',
                default => 'قيود جدولة غير مستوفاة',
            };
        }, $topReasons);

        $reasonsText = !empty($translatedReasons)
            ? 'الأسباب الأرجح: ' . implode('، ', $translatedReasons)
            : 'لم يتم العثور على فترة تستوفي جميع القيود.';

        return "تعذر جدولة {$assignment->subject->name} للمجموعة {$group->group_name}. {$reasonsText}";
    }

    private function normalizeTime(string $value): string
    {
        return substr($value, 0, 5);
    }
}
