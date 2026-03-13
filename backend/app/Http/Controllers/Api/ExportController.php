<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Subject;
use App\Models\StudentGrade;
use App\Models\AttendanceRecord;
use App\Models\StudentInvoice;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    /**
     * Export students list as CSV
     */
    public function students(Request $request): StreamedResponse
    {
        $query = Student::with('department:id,name');

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('name_en', 'like', "%{$term}%")
                  ->orWhere('campus_id', 'like', "%{$term}%")
                  ->orWhere('national_id_passport', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%")
                  ->orWhere('phone', 'like', "%{$term}%");
            });
        }

        $students = $query->orderBy('campus_id')->get();

        $headers = [
            'الرقم الجامعي',
            'الاسم',
            'الاسم (إنجليزي)',
            'البريد الإلكتروني',
            'الهاتف',
            'القسم',
            'السنة',
            'الحالة',
            'الجنس',
            'الجنسية',
            'تاريخ الميلاد',
            'تاريخ التسجيل',
            'رقم الهوية/الجواز',
            'اسم ولي الأمر',
            'هاتف ولي الأمر',
        ];

        $mapRow = function ($student) {
            return [
                $student->campus_id,
                $student->name,
                $student->name_en,
                $student->email,
                $student->phone,
                $student->department?->name ?? '',
                $student->year,
                $this->translateStatus($student->status),
                $this->translateGender($student->gender),
                $student->nationality,
                $student->birth_date?->format('Y-m-d'),
                $student->enrollment_date?->format('Y-m-d'),
                $student->national_id_passport,
                $student->sponsor_name,
                $student->sponsor_contact,
            ];
        };

        return $this->streamCsv("student_list_" . date('Y-m-d') . ".csv", $headers, $students, $mapRow);
    }

    /**
     * Export teachers list as CSV
     */
    public function teachers(Request $request): StreamedResponse
    {
        $query = Teacher::with('department:id,name');

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('name_en', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%")
                  ->orWhere('specialization', 'like', "%{$term}%");
            });
        }

        $teachers = $query->orderBy('campus_id')->get();

        $headers = [
            'الرقم الجامعي',
            'الاسم',
            'الاسم (إنجليزي)',
            'البريد الإلكتروني',
            'الهاتف',
            'القسم',
            'التخصص',
            'المؤهل العلمي',
            'المستوى التعليمي',
            'سنوات الخبرة',
            'ساعات التدريس',
            'الراتب الأساسي',
            'سعر الساعة',
            'الحالة',
        ];

        $mapRow = function ($teacher) {
            return [
                $teacher->campus_id,
                $teacher->name,
                $teacher->name_en,
                $teacher->email,
                $teacher->phone,
                $teacher->department?->name ?? '',
                $teacher->specialization,
                $teacher->qualification,
                $teacher->education_level,
                $teacher->years_experience,
                $teacher->teaching_hours,
                $teacher->basic_salary,
                $teacher->hourly_rate,
                $teacher->is_active ? 'نشط' : 'غير نشط',
            ];
        };

        return $this->streamCsv("teacher_list_" . date('Y-m-d') . ".csv", $headers, $teachers, $mapRow);
    }

    /**
     * Export subjects list as CSV
     */
    public function subjects(Request $request): StreamedResponse
    {
        $query = Subject::with('department:id,name');

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('semester_number')) {
            $query->where('semester_number', $request->semester_number);
        }
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('name_en', 'like', "%{$term}%")
                  ->orWhere('code', 'like', "%{$term}%");
            });
        }

        $subjects = $query->orderBy('code')->get();

        $headers = [
            'رمز المقرر',
            'اسم المقرر',
            'الاسم (إنجليزي)',
            'القسم',
            'الساعات المعتمدة',
            'الساعات الأسبوعية',
            'ساعات نظري',
            'ساعات عملي',
            'الفصل الدراسي',
            'نوع المقرر',
            'إجباري',
            'تكلفة الساعة',
            'الحد الأقصى للطلاب',
            'الحالة',
        ];

        $mapRow = function ($subject) {
            return [
                $subject->code,
                $subject->name,
                $subject->name_en,
                $subject->department?->name ?? '',
                $subject->credits,
                $subject->weekly_hours,
                $subject->theoretical_hours,
                $subject->practical_hours,
                $subject->semester_number,
                $subject->subject_type,
                $subject->is_required ? 'نعم' : 'لا',
                $subject->cost_per_credit,
                $subject->max_students,
                $subject->is_active ? 'مفعّل' : 'معطّل',
            ];
        };

        return $this->streamCsv("subject_list_" . date('Y-m-d') . ".csv", $headers, $subjects, $mapRow);
    }

    /**
     * Export grades as CSV
     */
    public function grades(Request $request): StreamedResponse
    {
        $query = StudentGrade::with([
            'student:id,campus_id,name',
            'subject:id,code,name',
            'teacher:id,name',
            'semester:id,name',
        ]);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }
        if ($request->filled('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }
        if ($request->filled('department_id')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        $grades = $query->orderBy('grade_date', 'desc')->get();

        $headers = [
            'الرقم الجامعي',
            'اسم الطالب',
            'رمز المقرر',
            'اسم المقرر',
            'الأستاذ',
            'الفصل الدراسي',
            'نوع الدرجة',
            'اسم الدرجة',
            'الدرجة',
            'من',
            'الوزن %',
            'تاريخ الدرجة',
            'منشورة',
        ];

        $mapRow = function ($grade) {
            return [
                $grade->student?->campus_id,
                $grade->student?->name,
                $grade->subject?->code,
                $grade->subject?->name,
                $grade->teacher?->name,
                $grade->semester?->name,
                $grade->grade_type,
                $grade->grade_name,
                $grade->grade_value,
                $grade->max_grade,
                $grade->weight,
                $grade->grade_date?->format('Y-m-d'),
                $grade->is_published ? 'نعم' : 'لا',
            ];
        };

        return $this->streamCsv("grade_sheet_" . date('Y-m-d') . ".csv", $headers, $grades, $mapRow);
    }

    /**
     * Export attendance records as CSV
     */
    public function attendance(Request $request): StreamedResponse
    {
        $query = AttendanceRecord::with([
            'student:id,campus_id,name',
            'session.subject:id,code,name',
            'session.teacher:id,name',
        ]);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('session_id')) {
            $query->where('session_id', $request->session_id);
        }

        $records = $query->orderBy('scan_time', 'desc')->limit(5000)->get();

        $headers = [
            'الرقم الجامعي',
            'اسم الطالب',
            'رمز المقرر',
            'اسم المقرر',
            'الأستاذ',
            'تاريخ الجلسة',
            'وقت التسجيل',
            'الحالة',
            'إدخال يدوي',
            'ملاحظات',
        ];

        $mapRow = function ($record) {
            return [
                $record->student?->campus_id,
                $record->student?->name,
                $record->session?->subject?->code,
                $record->session?->subject?->name,
                $record->session?->teacher?->name,
                $record->session?->session_date ?? '',
                $record->scan_time?->format('Y-m-d H:i'),
                $this->translateAttendanceStatus($record->status),
                $record->is_manual_entry ? 'نعم' : 'لا',
                $record->notes,
            ];
        };

        return $this->streamCsv("attendance_report_" . date('Y-m-d') . ".csv", $headers, $records, $mapRow);
    }

    /**
     * Export invoices as CSV
     */
    public function invoices(Request $request): StreamedResponse
    {
        $query = StudentInvoice::with([
            'student:id,campus_id,name',
            'semester:id,name',
            'department:id,name',
        ]);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $term = $request->search;
            $query->whereHas('student', function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('campus_id', 'like', "%{$term}%")
                  ->orWhere('national_id_passport', 'like', "%{$term}%");
            });
        }

        $invoices = $query->orderBy('invoice_date', 'desc')->get();

        $headers = [
            'رقم الفاتورة',
            'الرقم الجامعي',
            'اسم الطالب',
            'القسم',
            'الفصل الدراسي',
            'تاريخ الفاتورة',
            'تاريخ الاستحقاق',
            'المبلغ الفرعي',
            'الخصم',
            'المبلغ الإجمالي',
            'المبلغ المدفوع',
            'الرصيد المتبقي',
            'الحالة',
            'ملاحظات',
        ];

        $mapRow = function ($invoice) {
            return [
                $invoice->invoice_number,
                $invoice->student?->campus_id,
                $invoice->student?->name,
                $invoice->department?->name,
                $invoice->semester?->name,
                $invoice->invoice_date?->format('Y-m-d'),
                $invoice->due_date?->format('Y-m-d'),
                $invoice->subtotal,
                $invoice->discount,
                $invoice->total_amount,
                $invoice->paid_amount,
                $invoice->balance,
                $this->translateInvoiceStatus($invoice->status),
                $invoice->notes,
            ];
        };

        return $this->streamCsv("invoice_report_" . date('Y-m-d') . ".csv", $headers, $invoices, $mapRow);
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Stream CSV response (memory-efficient for large datasets)
     */
    private function streamCsv(string $filename, array $headers, $rows, callable $mapRow): StreamedResponse
    {
        return new StreamedResponse(function () use ($headers, $rows, $mapRow) {
            $handle = fopen('php://output', 'w');

            // BOM for Excel UTF-8 recognition
            fwrite($handle, "\xEF\xBB\xBF");

            // Header row — use tab separator so Excel always splits columns correctly
            fputcsv($handle, $headers, "\t");

            // Data rows
            foreach ($rows as $row) {
                fputcsv($handle, $mapRow($row), "\t");
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/tab-separated-values; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    private function translateStatus(?string $status): string
    {
        return match ($status) {
            'active' => 'نشط',
            'inactive' => 'غير نشط',
            'graduated' => 'متخرج',
            'suspended' => 'موقوف',
            'withdrawn' => 'منسحب',
            default => $status ?? '',
        };
    }

    private function translateGender(?string $gender): string
    {
        return match ($gender) {
            'male' => 'ذكر',
            'female' => 'أنثى',
            default => $gender ?? '',
        };
    }

    private function translateAttendanceStatus(?string $status): string
    {
        return match ($status) {
            'present' => 'حاضر',
            'absent' => 'غائب',
            'late' => 'متأخر',
            'excused' => 'معذور',
            default => $status ?? '',
        };
    }

    private function translateInvoiceStatus(?string $status): string
    {
        return match ($status) {
            'paid' => 'مدفوعة',
            'unpaid' => 'غير مدفوعة',
            'partial' => 'مدفوعة جزئياً',
            'overdue' => 'متأخرة',
            'cancelled' => 'ملغاة',
            'draft' => 'مسودة',
            default => $status ?? '',
        };
    }
}
