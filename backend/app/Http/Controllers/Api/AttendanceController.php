<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUser;
use App\Models\AttendanceRecord;
use App\Models\ClassSession;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = AttendanceRecord::with('session.subject', 'student', 'markedBy:id,name,email');

        if ($request->has('session_id')) {
            $query->where('session_id', $request->session_id);
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $query->orderBy('scan_time', 'desc');

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|exists:class_sessions,id',
            'student_id' => 'required|exists:students,id',
            'status' => 'nullable|in:present,late,absent,excused',
            'student_qr_code' => 'nullable|string',
            'class_qr_signature' => 'nullable|string',
            'ip_address' => 'nullable|string',
            'user_agent' => 'nullable|string',
            'location_data' => 'nullable|array',
            'is_manual_entry' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $session = ClassSession::findOrFail($request->session_id);
        $this->authorize('markAttendance', $session);

        $isManager = $this->isManager($request);

        $attendance = AttendanceRecord::firstOrNew([
            'session_id' => $request->session_id,
            'student_id' => $request->student_id,
        ]);

        $isNewRecord = !$attendance->exists;

        $attendance->fill([
            'marked_by_id' => auth('api')->id(),
            'scan_time' => $request->scan_time ?? $attendance->scan_time ?? now(),
            'status' => $request->status ?? 'present',
            'student_qr_code' => $request->student_qr_code,
            'class_qr_signature' => $request->class_qr_signature,
            'ip_address' => $request->ip_address,
            'user_agent' => $request->user_agent,
            'location_data' => $request->location_data,
            'is_manual_entry' => $request->has('is_manual_entry')
                ? $request->boolean('is_manual_entry')
                : ((bool) $attendance->is_manual_entry),
            'is_override' => $isManager || (bool) $attendance->is_override,
            'notes' => $request->notes,
        ]);

        $attendance->save();

        $attendance->load('session', 'student', 'markedBy:id,name,email');

        return response()->json($attendance, $isNewRecord ? 201 : 200);
    }

    public function show($id)
    {
        $attendance = AttendanceRecord::with('session.subject', 'session.teacher', 'student', 'markedBy:id,name,email')
            ->findOrFail($id);
        return response()->json($attendance);
    }

    public function update(Request $request, $id)
    {
        $attendance = AttendanceRecord::findOrFail($id);
        $session = ClassSession::findOrFail($attendance->session_id);

        $this->authorize('markAttendance', $session);

        $isManager = $this->isManager($request);

        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:present,late,absent,excused',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $attendance->update([
            'status' => $request->status ?? $attendance->status,
            'notes' => $request->notes ?? $attendance->notes,
            'marked_by_id' => auth('api')->id(),
            'is_override' => $isManager ? true : $attendance->is_override,
        ]);
        $attendance->load('session', 'student', 'markedBy:id,name,email');

        return response()->json($attendance);
    }

    public function destroy($id)
    {
        $attendance = AttendanceRecord::findOrFail($id);
        $attendance->delete();
        return response()->json(['message' => 'Attendance record deleted successfully'], 200);
    }

    public function bySession($sessionId)
    {
        $records = AttendanceRecord::with('student', 'markedBy:id,name,email')
            ->where('session_id', $sessionId)
            ->orderBy('scan_time')
            ->get();

        return response()->json($records);
    }

    public function byStudent($studentId)
    {
        $records = AttendanceRecord::with('session.subject', 'session.teacher', 'markedBy:id,name,email')
            ->where('student_id', $studentId)
            ->orderBy('scan_time', 'desc')
            ->get();

        return response()->json($records);
    }

    public function statistics($sessionId)
    {
        $session = ClassSession::findOrFail($sessionId);
        
        $stats = [
            'total' => $session->attendanceRecords()->count(),
            'present' => $session->attendanceRecords()->where('status', 'present')->count(),
            'late' => $session->attendanceRecords()->where('status', 'late')->count(),
            'absent' => $session->attendanceRecords()->where('status', 'absent')->count(),
            'excused' => $session->attendanceRecords()->where('status', 'excused')->count(),
        ];

        $stats['attendance_rate'] = $stats['total'] > 0 
            ? round((($stats['present'] + $stats['late']) / $stats['total']) * 100, 2)
            : 0;

        return response()->json($stats);
    }

    // Session Management Methods
    public function createSession(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'timetable_id' => 'nullable|exists:timetable_entries,id',
            'teacher_id' => 'required|exists:teachers,id',
            'subject_id' => 'required|exists:subjects,id',
            'department_id' => 'nullable|exists:departments,id',
            'session_name' => 'required|string|max:255',
            'session_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:100',
            'status' => 'nullable|in:scheduled,cancelled,completed',
            'max_students' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $session = ClassSession::create([
            'timetable_id' => $request->timetable_id,
            'teacher_id' => $request->teacher_id,
            'subject_id' => $request->subject_id,
            'department_id' => $request->department_id,
            'session_name' => $request->session_name,
            'session_date' => $request->session_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'room' => $request->room,
            'status' => $request->status ?? 'scheduled',
            'max_students' => $request->max_students ?? 50,
            'notes' => $request->notes,
        ]);
        $session->load(['teacher', 'subject', 'department']);

        return response()->json($session, 201);
    }

    public function getSession($sessionId)
    {
        $session = ClassSession::with(['teacher', 'subject', 'department', 'timetableEntry', 'attendanceRecords.student'])
            ->findOrFail($sessionId);

        return response()->json($session);
    }

    public function updateSession(Request $request, $sessionId)
    {
        $session = ClassSession::findOrFail($sessionId);

        $validator = Validator::make($request->all(), [
            'timetable_id' => 'nullable|exists:timetable_entries,id',
            'teacher_id' => 'sometimes|exists:teachers,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'department_id' => 'nullable|exists:departments,id',
            'session_name' => 'sometimes|string|max:255',
            'session_date' => 'sometimes|date',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:100',
            'status' => 'nullable|in:scheduled,cancelled,completed',
            'max_students' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $session->update($request->only([
            'timetable_id',
            'teacher_id',
            'subject_id',
            'department_id',
            'session_name',
            'session_date',
            'start_time',
            'end_time',
            'room',
            'status',
            'max_students',
            'notes',
        ]));

        $session->load(['teacher', 'subject', 'department', 'timetableEntry']);

        return response()->json($session);
    }

    public function destroySession($sessionId)
    {
        $session = ClassSession::findOrFail($sessionId);
        $session->delete();

        return response()->json(['message' => 'Class session deleted successfully']);
    }

    public function generateSessionQR($sessionId)
    {
        $session = ClassSession::findOrFail($sessionId);

        $expiresAt = Carbon::parse($session->session_date->toDateString() . ' ' . $session->end_time)->addHour();

        $payload = [
            'type' => 'class_session',
            'session_id' => $session->id,
            'teacher_id' => $session->teacher_id,
            'subject_id' => $session->subject_id,
            'session_date' => $session->session_date->toDateString(),
            'expires_at' => $expiresAt->toIso8601String(),
            'generated_at' => now()->toIso8601String(),
        ];

        $signature = hash_hmac('sha256', json_encode($payload), config('app.key'));
        $qrData = json_encode(array_merge($payload, ['signature' => $signature]));

        $session->update([
            'qr_code_data' => $qrData,
            'qr_signature' => $signature,
            'qr_generated_at' => now(),
            'qr_expires_at' => $expiresAt,
        ]);

        return response()->json([
            'session_id' => $session->id,
            'qrData' => $qrData,
            'expiresAt' => $expiresAt->toIso8601String(),
        ]);
    }

    public function getSessionAttendance($sessionId)
    {
        $records = AttendanceRecord::with('student', 'markedBy:id,name,email')
            ->where('session_id', $sessionId)
            ->orderBy('scan_time')
            ->get();

        return response()->json($records);
    }

    private function isManager(Request $request): bool
    {
        $authUser = $request->user('api');

        if (!$authUser) {
            return false;
        }

        $appUser = AppUser::with('roleModel')->where('auth_user_id', $authUser->id)->first();

        if (!$appUser) {
            return false;
        }

        $roleName = $appUser->roleModel?->name ?? $appUser->role;

        return $roleName === 'manager';
    }
}
