<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DepartmentTransferService;
use App\Models\DepartmentTransfer;
use App\Traits\LogsUserActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DepartmentTransferController extends Controller
{
    use LogsUserActions;

    public function index(Request $request)
    {
        $query = DepartmentTransfer::with(['student:id,name,campus_id', 'fromDepartment:id,name', 'toDepartment:id,name', 'semester:id,name']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        $transfer = DepartmentTransfer::with(['student', 'fromDepartment', 'toDepartment', 'semester'])->findOrFail($id);
        return response()->json($transfer);
    }

    public function initiate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|string|exists:students,id',
            'to_department_id' => 'required|string|exists:departments,id',
            'reason' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $transfer = DepartmentTransferService::initiateTransfer(
                $request->student_id,
                $request->to_department_id,
                $request->reason,
                auth()->id() ? (string) auth()->id() : null
            );

            $this->logAction('initiate', 'department-transfer', $transfer->id, [
                'student_id' => $request->student_id,
                'to_department_id' => $request->to_department_id,
            ]);

            return response()->json([
                'message' => 'تم إنشاء طلب النقل بنجاح',
                'transfer' => $transfer->load(['student:id,name,campus_id', 'fromDepartment:id,name', 'toDepartment:id,name']),
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function execute(Request $request, $id)
    {
        try {
            $transfer = DepartmentTransferService::executeTransfer($id, $request->input('admin_notes'));

            $this->logAction('execute', 'department-transfer', $id, [
                'student_id' => $transfer->student_id,
                'credits_transferred' => $transfer->credits_transferred,
            ]);

            return response()->json([
                'message' => 'تم تنفيذ النقل بنجاح',
                'transfer' => $transfer,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function reject(Request $request, $id)
    {
        try {
            $transfer = DepartmentTransferService::rejectTransfer($id, $request->input('admin_notes'));

            $this->logAction('reject', 'department-transfer', $id);

            return response()->json([
                'message' => 'تم رفض طلب النقل',
                'transfer' => $transfer,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function studentTransfers($studentId)
    {
        $transfers = DepartmentTransferService::getStudentTransfers($studentId);
        return response()->json($transfers);
    }
}
