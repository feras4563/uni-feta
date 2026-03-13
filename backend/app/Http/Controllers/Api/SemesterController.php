<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Semester;
use App\Models\StudyYear;
use App\Models\ClassSession;
use App\Models\TimetableEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SemesterController extends Controller
{
    public function index(Request $request)
    {
        $query = Semester::with('studyYear:id,name,name_en,is_active')
            ->withCount([
                'studentSemesterRegistrations',
                'timetableEntries',
                'timetableEntries as active_timetable_entries_count' => fn($q) => $q->where('is_active', true),
                'studentGroups',
            ]);

        if ($request->has('study_year_id')) {
            $query->where('study_year_id', $request->study_year_id);
        }

        if ($request->has('is_current')) {
            $query->where('is_current', $request->boolean('is_current'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $query->orderBy('start_date', 'desc');

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'name_en' => 'nullable|string',
            'code' => 'required|string',
            'study_year_id' => 'required|exists:study_years,id',
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

        // Validate parent study year is active
        $studyYear = StudyYear::findOrFail($data['study_year_id']);
        if (!$studyYear->is_active) {
            return response()->json([
                'message' => 'لا يمكن إنشاء فصل دراسي تحت سنة دراسية غير نشطة.',
            ], 422);
        }

        // If marking as current, clear other current semesters
        if (!empty($data['is_current'])) {
            Semester::query()->update(['is_current' => false]);
        }

        $semester = Semester::create($data);
        $semester->load('studyYear:id,name,name_en,is_active');
        $semester->loadCount(['studentSemesterRegistrations', 'timetableEntries', 'studentGroups']);

        return response()->json($semester, 201);
    }

    public function show($id)
    {
        $semester = Semester::with('studyYear', 'studentGroups', 'departmentSemesterSubjects')
            ->withCount(['studentSemesterRegistrations', 'timetableEntries', 'studentGroups'])
            ->findOrFail($id);
        return response()->json($semester);
    }

    public function update(Request $request, $id)
    {
        $semester = Semester::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string',
            'name_en' => 'nullable|string',
            'code' => 'sometimes|required|string',
            'study_year_id' => 'sometimes|required|exists:study_years,id',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'is_current' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Guard: cannot edit finalized semester dates
        if ($semester->isFinalized() && ($request->has('start_date') || $request->has('end_date'))) {
            return response()->json([
                'message' => 'لا يمكن تعديل تواريخ فصل دراسي مُغلق.',
            ], 422);
        }

        $data = $request->all();
        $datesChanged = $request->has('start_date') || $request->has('end_date');

        // If marking as current, clear others
        if (isset($data['is_current']) && $data['is_current']) {
            Semester::where('id', '!=', $id)->update(['is_current' => false]);
        }

        $semester->update($data);
        $semester->load('studyYear:id,name,name_en,is_active');
        $semester->loadCount(['studentSemesterRegistrations', 'timetableEntries', 'studentGroups']);

        // When semester dates change and the semester is in_progress,
        // re-sync all class sessions to reflect the new date range.
        if ($datesChanged && $semester->status === 'in_progress') {
            $sessionSync = app(\App\Services\ClassSessionGenerationService::class)
                ->syncForSemester($semester->id);

            return response()->json([
                'semester' => $semester,
                'session_sync' => $sessionSync,
            ]);
        }

        return response()->json($semester);
    }

    /**
     * Toggle the is_active status of a semester.
     * Deactivating cancels all non-completed sessions and clears is_current.
     * Activating validates the parent study year is active.
     */
    public function toggleActive($id)
    {
        $semester = Semester::with('studyYear')->findOrFail($id);
        $newActive = !$semester->is_active;

        return DB::transaction(function () use ($semester, $newActive) {
            $cascadeInfo = [];

            if ($newActive) {
                // Activating: parent study year must be active
                if (!$semester->studyYear || !$semester->studyYear->is_active) {
                    return response()->json([
                        'message' => 'لا يمكن تفعيل فصل دراسي تحت سنة دراسية غير نشطة. قم بتفعيل السنة الدراسية أولاً.',
                    ], 422);
                }
            } else {
                // Deactivating: cancel non-completed sessions
                $cancelledSessions = 0;
                $entryIds = TimetableEntry::where('semester_id', $semester->id)->pluck('id');
                if ($entryIds->isNotEmpty()) {
                    $cancelledSessions = ClassSession::whereIn('timetable_id', $entryIds)
                        ->whereNotIn('status', ['completed', 'cancelled'])
                        ->update([
                            'status' => 'cancelled',
                            'notes' => DB::raw("CONCAT(COALESCE(notes, ''), ' | Auto-cancelled: semester deactivated')"),
                        ]);
                }
                $cascadeInfo['cancelled_sessions'] = $cancelledSessions;

                // Clear is_current
                if ($semester->is_current) {
                    $semester->is_current = false;
                }
            }

            $semester->is_active = $newActive;
            $semester->save();

            $semester->load('studyYear:id,name,name_en,is_active');
            $semester->loadCount([
                'studentSemesterRegistrations',
                'timetableEntries',
                'timetableEntries as active_timetable_entries_count' => fn($q) => $q->where('is_active', true),
                'studentGroups',
            ]);

            return response()->json([
                'message' => $newActive
                    ? 'تم تفعيل الفصل الدراسي بنجاح'
                    : 'تم تعطيل الفصل الدراسي بنجاح',
                'semester' => $semester,
                'cascade' => $cascadeInfo,
            ]);
        });
    }

    public function destroy($id)
    {
        $semester = Semester::withCount([
            'studentSemesterRegistrations',
            'timetableEntries',
        ])->findOrFail($id);

        // Guard: cannot delete current semester
        if ($semester->is_current) {
            return response()->json([
                'message' => 'لا يمكن حذف الفصل الدراسي الحالي. قم بتعيين فصل آخر كحالي أولاً.',
            ], 422);
        }

        // Guard: cannot delete if it has registrations
        if ($semester->student_semester_registrations_count > 0) {
            return response()->json([
                'message' => 'لا يمكن حذف هذا الفصل لأنه يحتوي على تسجيلات طلاب. قم بتعطيله بدلاً من ذلك.',
                'registrations_count' => $semester->student_semester_registrations_count,
            ], 422);
        }

        // Guard: cannot delete non-registration_open semesters
        if ($semester->status && $semester->status !== 'registration_open') {
            return response()->json([
                'message' => 'لا يمكن حذف فصل دراسي حالته ليست "التسجيل مفتوح". قم بتعطيله بدلاً من ذلك.',
            ], 422);
        }

        // Clean up timetable entries and sessions before deleting
        if ($semester->timetable_entries_count > 0) {
            $entryIds = TimetableEntry::where('semester_id', $id)->pluck('id');
            ClassSession::whereIn('timetable_id', $entryIds)->delete();
            TimetableEntry::where('semester_id', $id)->delete();
        }

        $semester->delete();
        return response()->json(['message' => 'تم حذف الفصل الدراسي بنجاح'], 200);
    }

    public function current()
    {
        $current = Semester::with('studyYear')->where('is_current', true)->first();
        return response()->json($current);
    }

    public function setCurrent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'semester_id' => 'required|exists:semesters,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $semester = Semester::with('studyYear')->findOrFail($request->semester_id);

        if (!$semester->is_active) {
            return response()->json([
                'message' => 'لا يمكن تعيين فصل دراسي غير نشط كحالي. قم بتفعيله أولاً.',
            ], 422);
        }

        // Set all semesters to not current
        Semester::query()->update(['is_current' => false]);
        $semester->update(['is_current' => true]);

        // Also set its parent study year as current
        StudyYear::query()->update(['is_current' => false]);
        StudyYear::where('id', $semester->study_year_id)->update(['is_current' => true]);

        return response()->json([
            'message' => 'تم تعيين الفصل الدراسي كحالي بنجاح',
            'semester' => $semester
        ]);
    }

    /**
     * Transition semester status: registration_open → in_progress → grade_entry → finalized
     */
    public function transitionStatus(Request $request, $id)
    {
        $semester = Semester::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:registration_open,in_progress,grade_entry,finalized',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $newStatus = $request->input('status');

        if (!$semester->canTransitionTo($newStatus)) {
            $currentLabel = self::statusLabel($semester->status ?? 'registration_open');
            $newLabel = self::statusLabel($newStatus);
            return response()->json([
                'message' => "لا يمكن الانتقال من \"{$currentLabel}\" إلى \"{$newLabel}\"",
                'current_status' => $semester->status,
                'allowed_transitions' => Semester::STATUS_TRANSITIONS[$semester->status ?? 'registration_open'] ?? [],
            ], 422);
        }

        $updateData = ['status' => $newStatus];

        if ($newStatus === 'finalized') {
            $updateData['finalized_at'] = now();
            $updateData['finalized_by'] = auth()->id();
        }

        $semester->update($updateData);
        $semester->load('studyYear');

        // When transitioning to in_progress, auto-generate all date-specific class sessions
        // from existing timetable entries within the semester date range (skipping holidays).
        $sessionSync = null;
        if ($newStatus === 'in_progress') {
            $sessionSync = app(\App\Services\ClassSessionGenerationService::class)
                ->syncForSemester($semester->id);
        }

        // When transitioning to finalized or grade_entry, auto-sync enrollment statuses
        if (in_array($newStatus, ['finalized', 'grade_entry'])) {
            $syncResult = \App\Services\GradeFinalizationService::syncAllForSemester($semester->id);
        }

        return response()->json([
            'message' => 'تم تحديث حالة الفصل الدراسي بنجاح',
            'semester' => $semester,
            'grade_sync' => $syncResult ?? null,
            'session_sync' => $sessionSync,
        ]);
    }

    private static function statusLabel(string $status): string
    {
        return match ($status) {
            'registration_open' => 'التسجيل مفتوح',
            'in_progress' => 'قيد التنفيذ',
            'grade_entry' => 'إدخال الدرجات',
            'finalized' => 'مُغلق',
            default => $status,
        };
    }

    /**
     * Bulk-sync enrollment statuses from published grades for a semester.
     * Useful for data repair or when enrollments are out of sync.
     */
    public function syncGrades($id)
    {
        $semester = Semester::findOrFail($id);
        $result = \App\Services\GradeFinalizationService::syncAllForSemester($semester->id);

        return response()->json([
            'message' => 'تم مزامنة حالات التسجيل مع الدرجات بنجاح',
            'semester_id' => $semester->id,
            'semester_name' => $semester->name,
            'result' => $result,
        ]);
    }

    /**
     * Get all students registered in a specific semester
     */
    public function getRegisteredStudents(Request $request, $id)
    {
        $query = \App\Models\StudentSemesterRegistration::with([
            'student:id,name,email,national_id_passport,phone',
            'department:id,name'
        ])
        ->where('semester_id', $id);

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $registrations = $query->get();

        $students = $registrations->map(function ($reg) {
            return [
                'id' => $reg->student->id ?? null,
                'name' => $reg->student->name ?? '-',
                'email' => $reg->student->email ?? '-',
                'national_id_passport' => $reg->student->national_id_passport ?? '-',
                'phone' => $reg->student->phone ?? '-',
                'department' => $reg->department,
                'registration_id' => $reg->id,
                'group_id' => $reg->group_id,
                'has_group' => !is_null($reg->group_id),
            ];
        })->filter(fn($s) => $s['id'] !== null)->values();

        return response()->json($students);
    }
}
