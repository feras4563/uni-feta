<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StudentAcademicProgress extends Model
{
    protected $table = 'student_academic_progress';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'student_id',
        'department_id',
        'current_semester',
        'current_study_year_id',
        'total_credits_earned',
        'gpa',
        'status',
        'academic_standing',
        'progression_notes',
        'last_evaluated_at',
        'graduation_date',
    ];

    protected $casts = [
        'current_semester' => 'integer',
        'total_credits_earned' => 'integer',
        'gpa' => 'decimal:2',
        'graduation_date' => 'date',
        'last_evaluated_at' => 'datetime',
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

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function currentStudyYear()
    {
        return $this->belongsTo(StudyYear::class, 'current_study_year_id');
    }
}
