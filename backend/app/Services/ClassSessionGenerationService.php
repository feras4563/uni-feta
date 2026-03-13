<?php

namespace App\Services;

use App\Models\ClassSession;
use App\Models\Holiday;
use App\Models\Semester;
use App\Models\TimetableEntry;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ClassSessionGenerationService
{
    /**
     * Generate/sync date-specific class sessions for a semester.
     * Optimized: batch-loads all existing sessions (1 query), pre-computes holiday
     * date set for O(1) lookup, then iterates timetable entries × dates in memory.
     *
     * @return array{created:int,updated:int,cancelled:int,skipped_holidays:int,total_entries:int}
     */
    public function syncForSemester(string $semesterId): array
    {
        $semester = Semester::findOrFail($semesterId);

        $entries = TimetableEntry::with(['subject:id,name,code', 'room:id,name,room_number'])
            ->where('semester_id', $semester->id)
            ->where('is_active', true)
            ->get();

        if ($entries->isEmpty()) {
            return ['created' => 0, 'updated' => 0, 'cancelled' => 0, 'skipped_holidays' => 0, 'total_entries' => 0];
        }

        $entryIds = $entries->pluck('id')->all();

        // Batch-load ALL existing sessions for these timetable entries (1 query)
        $existingSessions = ClassSession::whereIn('timetable_id', $entryIds)->get();
        $sessionMap = [];
        foreach ($existingSessions as $session) {
            $key = $session->timetable_id . '|' . Carbon::parse($session->session_date)->toDateString();
            $sessionMap[$key] = $session;
        }

        // Pre-compute holiday date set for O(1) lookup
        $holidays = Holiday::all();
        $holidayDates = $this->buildHolidayDateSet(
            $holidays,
            Carbon::parse($semester->start_date),
            Carbon::parse($semester->end_date)
        );

        $created = 0;
        $updated = 0;
        $cancelled = 0;
        $skippedHolidays = 0;
        $validKeys = [];

        foreach ($entries as $entry) {
            $cursor = Carbon::parse($semester->start_date)->startOfDay();
            $end = Carbon::parse($semester->end_date)->startOfDay();

            while ($cursor->lte($end)) {
                $entryDay = (int) $entry->day_of_week;
                $matchesDay = $entryDay === (int) $cursor->dayOfWeek
                    || $entryDay === (int) $cursor->dayOfWeekIso;

                if (!$matchesDay) {
                    $cursor->addDay();
                    continue;
                }

                $sessionDate = $cursor->toDateString();
                $sessionKey = $entry->id . '|' . $sessionDate;

                if (isset($holidayDates[$sessionDate])) {
                    $skippedHolidays++;
                    $cursor->addDay();
                    continue;
                }

                $validKeys[$sessionKey] = true;

                $session = $sessionMap[$sessionKey] ?? null;

                $payload = [
                    'timetable_id' => $entry->id,
                    'teacher_id' => $entry->teacher_id,
                    'subject_id' => $entry->subject_id,
                    'department_id' => $entry->department_id,
                    'session_name' => ($entry->subject?->name ?? 'Session') . ' - ' . $sessionDate,
                    'session_date' => $sessionDate,
                    'start_time' => $entry->start_time,
                    'end_time' => $entry->end_time,
                    'room' => $entry->room?->room_number ?? $entry->room?->name,
                    'notes' => 'Generated from timetable entry',
                ];

                if ($session) {
                    if ($session->status !== 'completed') {
                        $payload['status'] = 'scheduled';
                    }
                    $session->update($payload);
                    $updated++;
                } else {
                    $payload['status'] = 'scheduled';
                    ClassSession::create($payload);
                    $created++;
                }

                $cursor->addDay();
            }
        }

        // Cancel orphaned sessions (exist in DB but no longer valid)
        foreach ($existingSessions as $session) {
            $key = $session->timetable_id . '|' . Carbon::parse($session->session_date)->toDateString();

            if (!isset($validKeys[$key]) && $session->status !== 'completed' && $session->status !== 'cancelled') {
                $session->update([
                    'status' => 'cancelled',
                    'notes' => trim(($session->notes ?? '') . ' | Auto-cancelled by schedule sync'),
                ]);
                $cancelled++;
            }
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'cancelled' => $cancelled,
            'skipped_holidays' => $skippedHolidays,
            'total_entries' => $entries->count(),
        ];
    }

    /**
     * Generate/sync class sessions for a single timetable entry within its semester date range.
     * Called after manual timetable entry create/update to keep sessions in sync.
     *
     * @return array{created:int,updated:int,cancelled:int,skipped_holidays:int}
     */
    public function syncForEntry(string $entryId): array
    {
        $entry = TimetableEntry::with(['subject:id,name,code', 'room:id,name,room_number', 'semester'])
            ->findOrFail($entryId);

        $semester = $entry->semester;
        if (!$semester || !$semester->start_date || !$semester->end_date) {
            return ['created' => 0, 'updated' => 0, 'cancelled' => 0, 'skipped_holidays' => 0];
        }

        $semesterStart = Carbon::parse($semester->start_date)->startOfDay();
        $semesterEnd = Carbon::parse($semester->end_date)->startOfDay();

        $existingSessions = ClassSession::where('timetable_id', $entry->id)->get();
        $sessionMap = [];
        foreach ($existingSessions as $session) {
            $key = Carbon::parse($session->session_date)->toDateString();
            $sessionMap[$key] = $session;
        }

        $holidays = Holiday::all();
        $holidayDates = $this->buildHolidayDateSet($holidays, $semesterStart, $semesterEnd);

        $created = 0;
        $updated = 0;
        $cancelled = 0;
        $skippedHolidays = 0;
        $validDates = [];

        if ($entry->is_active) {
            $cursor = $semesterStart->copy();

            while ($cursor->lte($semesterEnd)) {
                $entryDay = (int) $entry->day_of_week;
                $matchesDay = $entryDay === (int) $cursor->dayOfWeek
                    || $entryDay === (int) $cursor->dayOfWeekIso;

                if (!$matchesDay) {
                    $cursor->addDay();
                    continue;
                }

                $sessionDate = $cursor->toDateString();

                if (isset($holidayDates[$sessionDate])) {
                    $skippedHolidays++;
                    $cursor->addDay();
                    continue;
                }

                $validDates[$sessionDate] = true;
                $session = $sessionMap[$sessionDate] ?? null;

                $payload = [
                    'timetable_id' => $entry->id,
                    'teacher_id' => $entry->teacher_id,
                    'subject_id' => $entry->subject_id,
                    'department_id' => $entry->department_id,
                    'session_name' => ($entry->subject?->name ?? 'Session') . ' - ' . $sessionDate,
                    'session_date' => $sessionDate,
                    'start_time' => $entry->start_time,
                    'end_time' => $entry->end_time,
                    'room' => $entry->room?->room_number ?? $entry->room?->name,
                    'notes' => 'Generated from timetable entry',
                ];

                if ($session) {
                    if ($session->status !== 'completed') {
                        $payload['status'] = 'scheduled';
                    }
                    $session->update($payload);
                    $updated++;
                } else {
                    $payload['status'] = 'scheduled';
                    ClassSession::create($payload);
                    $created++;
                }

                $cursor->addDay();
            }
        }

        // Cancel orphaned sessions
        foreach ($existingSessions as $session) {
            $dateKey = Carbon::parse($session->session_date)->toDateString();
            if (!isset($validDates[$dateKey]) && $session->status !== 'completed' && $session->status !== 'cancelled') {
                $session->update([
                    'status' => 'cancelled',
                    'notes' => trim(($session->notes ?? '') . ' | Auto-cancelled by schedule sync'),
                ]);
                $cancelled++;
            }
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'cancelled' => $cancelled,
            'skipped_holidays' => $skippedHolidays,
        ];
    }

    /**
     * Check whether a given date is a holiday, using proper recurring-holiday expansion
     * within a semester's date range.
     */
    public function isHolidayDate(string $dateString, Carbon $semesterStart, Carbon $semesterEnd): bool
    {
        $holidays = Holiday::all();
        $holidayDates = $this->buildHolidayDateSet($holidays, $semesterStart, $semesterEnd);

        return isset($holidayDates[$dateString]);
    }

    /**
     * Pre-compute a set of holiday dates (YYYY-MM-DD => true) for O(1) lookup.
     * Expands each holiday's date range into individual dates within the semester window.
     */
    public function buildHolidayDateSet(Collection $holidays, Carbon $semesterStart, Carbon $semesterEnd): array
    {
        $set = [];
        $years = range($semesterStart->year, $semesterEnd->year);

        foreach ($holidays as $holiday) {
            $start = Carbon::parse($holiday->start_date)->startOfDay();
            $end = Carbon::parse($holiday->end_date)->startOfDay();

            if (!$holiday->is_recurring) {
                $cursor = $start->copy();
                while ($cursor->lte($end)) {
                    if ($cursor->betweenIncluded($semesterStart, $semesterEnd)) {
                        $set[$cursor->toDateString()] = true;
                    }
                    $cursor->addDay();
                }
                continue;
            }

            // Recurring: expand for each year in the semester range
            foreach ($years as $year) {
                $recurringStart = Carbon::create($year, $start->month, $start->day)->startOfDay();
                $recurringEnd = Carbon::create($year, $end->month, $end->day)->startOfDay();

                if ($recurringStart->gt($recurringEnd)) {
                    // Cross-year (e.g., Dec 30 -> Jan 2): expand both sides
                    $cursor = $recurringStart->copy();
                    while ($cursor->year === $year) {
                        if ($cursor->betweenIncluded($semesterStart, $semesterEnd)) {
                            $set[$cursor->toDateString()] = true;
                        }
                        $cursor->addDay();
                    }
                    $cursor = Carbon::create($year, 1, 1)->startOfDay();
                    while ($cursor->lte($recurringEnd)) {
                        if ($cursor->betweenIncluded($semesterStart, $semesterEnd)) {
                            $set[$cursor->toDateString()] = true;
                        }
                        $cursor->addDay();
                    }
                } else {
                    $cursor = $recurringStart->copy();
                    while ($cursor->lte($recurringEnd)) {
                        if ($cursor->betweenIncluded($semesterStart, $semesterEnd)) {
                            $set[$cursor->toDateString()] = true;
                        }
                        $cursor->addDay();
                    }
                }
            }
        }

        return $set;
    }
}
