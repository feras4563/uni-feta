<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StudentSubjectEnrollment extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'student_id',
        'subject_id',
        'semester_id',
        'study_year_id',
        'department_id',
        'semester_number',
        'enrollment_date',
        'status',
        'payment_status',
        'attendance_allowed',
        'admin_override',
        'invoice_id',
        'grade',
        'grade_letter',
        'passed',
        'notes',
        'is_retake',
        'original_enrollment_id',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'grade' => 'decimal:2',
        'passed' => 'boolean',
        'attendance_allowed' => 'boolean',
        'admin_override' => 'boolean',
        'is_retake' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
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

    public function invoice()
    {
        return $this->belongsTo(StudentInvoice::class, 'invoice_id');
    }

    public function originalEnrollment()
    {
        return $this->belongsTo(self::class, 'original_enrollment_id');
    }

    public function retakeEnrollments()
    {
        return $this->hasMany(self::class, 'original_enrollment_id');
    }
}
