<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\ClassSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = AttendanceRecord::with('session.subject', 'student');

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

        $attendance = AttendanceRecord::create($request->all());
        $attendance->load('session', 'student');

        return response()->json($attendance, 201);
    }

    public function show($id)
    {
        $attendance = AttendanceRecord::with('session.subject', 'session.teacher', 'student')->findOrFail($id);
        return response()->json($attendance);
    }

    public function update(Request $request, $id)
    {
        $attendance = AttendanceRecord::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:present,late,absent,excused',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $attendance->update($request->all());
        $attendance->load('session', 'student');

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
        $records = AttendanceRecord::with('student')
            ->where('session_id', $sessionId)
            ->orderBy('scan_time')
            ->get();

        return response()->json($records);
    }

    public function byStudent($studentId)
    {
        $records = AttendanceRecord::with('session.subject', 'session.teacher')
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
            'teacher_id' => 'required|exists:teachers,id',
            'subject_id' => 'required|exists:subjects,id',
            'department_id' => 'nullable|exists:departments,id',
            'session_name' => 'required|string|max:255',
            'session_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:100',
            'status' => 'nullable|in:scheduled,active,completed,cancelled',
            'max_students' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $session = ClassSession::create($request->all());
        $session->load(['teacher', 'subject', 'department']);

        return response()->json($session, 201);
    }

    public function getSession($sessionId)
    {
        $session = ClassSession::with(['teacher', 'subject', 'department', 'attendanceRecords.student'])
            ->findOrFail($sessionId);

        return response()->json($session);
    }

    public function getSessionAttendance($sessionId)
    {
        $records = AttendanceRecord::with('student')
            ->where('session_id', $sessionId)
            ->orderBy('scan_time')
            ->get();

        return response()->json($records);
    }
}
