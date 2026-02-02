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
        'grade',
        'grade_letter',
        'passed',
        'notes',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'grade' => 'decimal:2',
        'passed' => 'boolean',
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
}
