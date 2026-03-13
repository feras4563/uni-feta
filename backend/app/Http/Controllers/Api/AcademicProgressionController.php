<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AcademicProgressionService;
use App\Traits\LogsUserActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AcademicProgressionController extends Controller
{
    use LogsUserActions;

    /**
     * Evaluate a single student's academic standing.
     */
    public function evaluate(Request $request, $studentId)
    {
        try {
            $result = AcademicProgressionService::evaluateStudent(
                $studentId,
                $request->input('study_year_id')
            );

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('Failed to evaluate student', ['student_id' => $studentId, 'error' => $e->getMessage()]);
            return response()->json([
                'message' => 'فشل في تقييم الطالب',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Promote a single student to the next semester.
     */
    public function promote(Request $request, $studentId)
    {
        try {
            $result = AcademicProgressionService::promoteStudent(
                $studentId,
                $request->input('study_year_id')
            );

            if ($result['promoted']) {
                $this->logAction('promote', 'academic-progression', $studentId, [
                    'new_semester' => $result['new_semester'],
                    'new_year' => $result['new_year'],
                ]);
            }

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('Failed to promote student', ['student_id' => $studentId, 'error' => $e->getMessage()]);
            return response()->json([
                'message' => 'فشل في ترقية الطالب',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk evaluate all active students (optionally filtered by department).
     */
    public function bulkEvaluate(Request $request)
    {
        try {
            $result = AcademicProgressionService::bulkEvaluate(
                $request->input('department_id'),
                $request->input('study_year_id')
            );

            $this->logAction('bulk-evaluate', 'academic-progression', null, [
                'department_id' => $request->input('department_id'),
                'total' => $result['total'],
                'evaluated' => $result['evaluated'],
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('Failed to bulk evaluate students', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'فشل في التقييم الجماعي',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk promote all eligible active students.
     */
    public function bulkPromote(Request $request)
    {
        try {
            $result = AcademicProgressionService::bulkPromote(
                $request->input('department_id'),
                $request->input('study_year_id')
            );

            $this->logAction('bulk-promote', 'academic-progression', null, [
                'department_id' => $request->input('department_id'),
                'total' => $result['total'],
                'promoted' => $result['promoted'],
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('Failed to bulk promote students', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'فشل في الترقية الجماعية',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get failed subjects eligible for retake.
     */
    public function retakeableSubjects($studentId)
    {
        try {
            $subjects = AcademicProgressionService::getRetakeableSubjects($studentId);
            return response()->json($subjects);
        } catch (\Exception $e) {
            \Log::error('Failed to get retakeable subjects', ['student_id' => $studentId, 'error' => $e->getMessage()]);
            return response()->json([
                'message' => 'فشل في جلب المقررات القابلة لإعادة التسجيل',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Enroll a student in retake subjects.
     */
    public function enrollRetake(Request $request, $studentId)
    {
        $validator = Validator::make($request->all(), [
            'subject_ids' => 'required|array|min:1',
            'subject_ids.*' => 'required|string|exists:subjects,id',
            'semester_id' => 'required|string|exists:semesters,id',
            'study_year_id' => 'required|string|exists:study_years,id',
            'department_id' => 'required|string|exists:departments,id',
            'semester_number' => 'required|integer|min:1|max:8',
            'is_paying' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'بيانات غير صالحة',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $enrollments = \DB::transaction(function () use ($request, $studentId) {
                return AcademicProgressionService::enrollRetakeSubjects(
                    $studentId,
                    $request->input('subject_ids'),
                    $request->input('semester_id'),
                    $request->input('study_year_id'),
                    $request->input('department_id'),
                    $request->input('semester_number'),
                    $request->boolean('is_paying', false)
                );
            });

            $this->logAction('retake-enroll', 'academic-progression', $studentId, [
                'subject_count' => count($enrollments),
                'semester_id' => $request->input('semester_id'),
            ]);

            return response()->json([
                'message' => 'تم تسجيل الطالب في مقررات الإعادة بنجاح',
                'enrollments' => $enrollments,
                'count' => count($enrollments),
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to enroll retake subjects', ['student_id' => $studentId, 'error' => $e->getMessage()]);
            return response()->json([
                'message' => 'فشل في تسجيل مقررات الإعادة',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
