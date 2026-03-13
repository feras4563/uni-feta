<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudyYear;
use App\Models\Semester;
use App\Models\ClassSession;
use App\Models\TimetableEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StudyYearController extends Controller
{
    public function index()
    {
        $studyYears = StudyYear::withCount([
            'semesters',
            'semesters as active_semesters_count' => fn($q) => $q->where('is_active', true),
            'studentSemesterRegistrations',
        ])
        ->with(['semesters:id,study_year_id,name,status,is_active,is_current,start_date,end_date'])
        ->orderBy('start_date', 'desc')
        ->get();

        return response()->json($studyYears);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:study_years,name',
            'name_en' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        // If marking as current, clear other current years
        if (!empty($data['is_current'])) {
            StudyYear::query()->update(['is_current' => false]);
        }

        $studyYear = StudyYear::create($data);
        $studyYear->loadCount(['semesters', 'studentSemesterRegistrations']);
        $studyYear->load('semesters:id,study_year_id,name,status,is_active,is_current,start_date,end_date');

        return response()->json($studyYear, 201);
    }

    public function show($id)
    {
        $studyYear = StudyYear::with('semesters')
            ->withCount(['semesters', 'studentSemesterRegistrations'])
            ->findOrFail($id);
        return response()->json($studyYear);
    }

    public function update(Request $request, $id)
    {
        $studyYear = StudyYear::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|unique:study_years,name,' . $id,
            'name_en' => 'nullable|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'is_current' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        // If marking as current, clear other current years
        if (isset($data['is_current']) && $data['is_current']) {
            StudyYear::where('id', '!=', $id)->update(['is_current' => false]);
        }

        $studyYear->update($data);
        $studyYear->loadCount(['semesters', 'studentSemesterRegistrations']);
        $studyYear->load('semesters:id,study_year_id,name,status,is_active,is_current,start_date,end_date');

        return response()->json($studyYear);
    }

    /**
     * Toggle the is_active status of a study year.
     * Deactivating cascades to all child semesters (deactivates them, cancels pending sessions).
     * Activating only activates the year; semesters must be activated individually.
     */
    public function toggleActive($id)
    {
        $studyYear = StudyYear::findOrFail($id);
        $newActive = !$studyYear->is_active;

        return DB::transaction(function () use ($studyYear, $newActive) {
            $cascadeInfo = [];

            if (!$newActive) {
                // Deactivating: cascade to all child semesters
                $activeSemesters = Semester::where('study_year_id', $studyYear->id)
                    ->where('is_active', true)
                    ->get();

                foreach ($activeSemesters as $semester) {
                    $semesterCascade = $this->deactivateSemesterCascade($semester);
                    $cascadeInfo[] = $semesterCascade;
                }

                // Clear is_current if the year was current
                if ($studyYear->is_current) {
                    $studyYear->is_current = false;
                }
            }

            $studyYear->is_active = $newActive;
            $studyYear->save();

            $studyYear->loadCount([
                'semesters',
                'semesters as active_semesters_count' => fn($q) => $q->where('is_active', true),
                'studentSemesterRegistrations',
            ]);
            $studyYear->load('semesters:id,study_year_id,name,status,is_active,is_current,start_date,end_date');

            return response()->json([
                'message' => $newActive
                    ? 'تم تفعيل السنة الدراسية بنجاح'
                    : 'تم تعطيل السنة الدراسية بنجاح',
                'study_year' => $studyYear,
                'cascade' => $cascadeInfo,
            ]);
        });
    }

    public function destroy($id)
    {
        $studyYear = StudyYear::withCount(['semesters', 'studentSemesterRegistrations'])->findOrFail($id);

        // Guard: cannot delete if it is the current year
        if ($studyYear->is_current) {
            return response()->json([
                'message' => 'لا يمكن حذف السنة الدراسية الحالية. قم بتعيين سنة أخرى كحالية أولاً.'
            ], 422);
        }

        // Guard: cannot delete if there are semesters with registrations
        if ($studyYear->student_semester_registrations_count > 0) {
            return response()->json([
                'message' => 'لا يمكن حذف هذه السنة الدراسية لأنها تحتوي على تسجيلات طلاب. قم بتعطيلها بدلاً من ذلك.',
                'registrations_count' => $studyYear->student_semester_registrations_count,
            ], 422);
        }

        // Guard: cannot delete if semesters exist that are not all in registration_open
        $nonDeletableSemesters = Semester::where('study_year_id', $id)
            ->where(function ($q) {
                $q->whereNotNull('status')
                  ->where('status', '!=', 'registration_open');
            })
            ->count();

        if ($nonDeletableSemesters > 0) {
            return response()->json([
                'message' => 'لا يمكن حذف هذه السنة لأنها تحتوي على فصول دراسية قيد التنفيذ أو مغلقة. قم بتعطيلها بدلاً من ذلك.',
            ], 422);
        }

        // Safe to delete: also delete empty registration_open semesters
        Semester::where('study_year_id', $id)->delete();
        $studyYear->delete();

        return response()->json(['message' => 'تم حذف السنة الدراسية بنجاح'], 200);
    }

    public function current()
    {
        $current = StudyYear::where('is_current', true)->first();
        return response()->json($current);
    }

    public function setCurrent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year_id' => 'required|exists:study_years,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $studyYear = StudyYear::findOrFail($request->year_id);

        if (!$studyYear->is_active) {
            return response()->json([
                'message' => 'لا يمكن تعيين سنة دراسية غير نشطة كحالية. قم بتفعيلها أولاً.',
            ], 422);
        }

        // Set all study years to not current
        StudyYear::query()->update(['is_current' => false]);

        $studyYear->update(['is_current' => true]);

        return response()->json([
            'message' => 'تم تعيين السنة الدراسية كحالية بنجاح',
            'study_year' => $studyYear
        ]);
    }

    /**
     * Helper: deactivate a single semester and cancel its pending sessions.
     */
    private function deactivateSemesterCascade(Semester $semester): array
    {
        $cancelledSessions = 0;

        // Cancel all non-completed sessions for this semester's timetable entries
        $entryIds = TimetableEntry::where('semester_id', $semester->id)->pluck('id');
        if ($entryIds->isNotEmpty()) {
            $cancelledSessions = ClassSession::whereIn('timetable_id', $entryIds)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->update([
                    'status' => 'cancelled',
                    'notes' => DB::raw("CONCAT(COALESCE(notes, ''), ' | Auto-cancelled: semester deactivated')"),
                ]);
        }

        // Deactivate the semester, clear is_current
        $semester->update([
            'is_active' => false,
            'is_current' => false,
        ]);

        return [
            'semester_id' => $semester->id,
            'semester_name' => $semester->name,
            'cancelled_sessions' => $cancelledSessions,
        ];
    }
}
