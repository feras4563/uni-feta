<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TeacherSubject extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'teacher_id',
        'subject_id',
        'department_id',
        'study_year_id',
        'semester_id',
        'academic_year',
        'is_primary_teacher',
        'can_edit_grades',
        'can_take_attendance',
        'is_active',
        'start_date',
        'end_date',
        'notes',
    ];

    protected $casts = [
        'is_primary_teacher' => 'boolean',
        'can_edit_grades' => 'boolean',
        'can_take_attendance' => 'boolean',
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
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
    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function studyYear()
    {
        return $this->belongsTo(StudyYear::class);
    }
}
