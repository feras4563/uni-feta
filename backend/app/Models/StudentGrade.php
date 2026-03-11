<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StudentGrade extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'student_id',
        'subject_id',
        'teacher_id',
        'semester_id',
        'grade_type',
        'grade_name',
        'grade_value',
        'max_grade',
        'weight',
        'grade_date',
        'due_date',
        'description',
        'feedback',
        'is_published',
    ];

    protected $casts = [
        'grade_value' => 'decimal:2',
        'max_grade' => 'decimal:2',
        'weight' => 'decimal:2',
        'grade_date' => 'date',
        'due_date' => 'date',
        'is_published' => 'boolean',
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

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }
}
