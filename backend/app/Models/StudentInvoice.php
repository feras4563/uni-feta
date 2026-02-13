<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StudentInvoice extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'invoice_number',
        'student_id',
        'semester_id',
        'study_year_id',
        'department_id',
        'semester_number',
        'invoice_date',
        'due_date',
        'subtotal',
        'discount',
        'tax',
        'total_amount',
        'paid_amount',
        'balance',
        'status',
        'notes',
        'journal_entry_id',
        'discount_type',
        'discount_percentage',
        'discount_reason',
        'discount_approved_by',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:3',
        'discount' => 'decimal:3',
        'tax' => 'decimal:3',
        'total_amount' => 'decimal:3',
        'paid_amount' => 'decimal:3',
        'balance' => 'decimal:3',
        'discount_percentage' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            if (empty($model->invoice_number)) {
                $model->invoice_number = self::generateInvoiceNumber();
            }
        });

        // Sync payment status to enrollments when invoice is updated
        static::updated(function ($model) {
            if ($model->isDirty('status') || $model->isDirty('paid_amount') || $model->isDirty('balance')) {
                $model->syncPaymentStatusToEnrollments();
            }
        });

        // Sync payment status when invoice is created
        static::created(function ($model) {
            $model->syncPaymentStatusToEnrollments();
        });
    }

    /**
     * Sync payment status to related enrollments
     */
    public function syncPaymentStatusToEnrollments()
    {
        // Determine payment status
        $paymentStatus = 'unpaid';
        $attendanceAllowed = false;

        if ($this->status === 'paid' || $this->balance == 0) {
            $paymentStatus = 'paid';
            $attendanceAllowed = true;
        } elseif ($this->paid_amount > 0) {
            $paymentStatus = 'partial';
            // Partial payment: attendance not allowed by default (admin can override)
            $attendanceAllowed = false;
        }

        // Update all enrollments for this student in this semester
        StudentSubjectEnrollment::where('student_id', $this->student_id)
            ->where('semester_id', $this->semester_id)
            ->where('study_year_id', $this->study_year_id)
            ->update([
                'payment_status' => $paymentStatus,
                'attendance_allowed' => \DB::raw("CASE 
                    WHEN admin_override = 1 THEN attendance_allowed 
                    ELSE " . ($attendanceAllowed ? '1' : '0') . " 
                END"),
                'invoice_id' => $this->id,
            ]);
    }

    public static function generateInvoiceNumber(): string
    {
        $year = date('Y');
        $lastInvoice = self::whereYear('invoice_date', $year)
            ->orderBy('invoice_number', 'desc')
            ->first();

        if ($lastInvoice) {
            $lastNumber = (int) substr($lastInvoice->invoice_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return 'INV-' . $year . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function studyYear()
    {
        return $this->belongsTo(StudyYear::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function items()
    {
        return $this->hasMany(StudentInvoiceItem::class, 'invoice_id');
    }

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class);
    }
}
