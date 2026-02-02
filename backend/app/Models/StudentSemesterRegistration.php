<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StudentSemesterRegistration extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'student_id',
        'semester_id',
        'study_year_id',
        'department_id',
        'group_id',
        'semester_number',
        'registration_date',
        'status',
        'tuition_paid',
        'notes',
    ];

    protected $casts = [
        'semester_number' => 'integer',
        'registration_date' => 'date',
        'tuition_paid' => 'boolean',
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

    public function group()
    {
        return $this->belongsTo(StudentGroup::class, 'group_id');
    }
}
