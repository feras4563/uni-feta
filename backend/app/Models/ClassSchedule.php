<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ClassSchedule extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'teacher_id',
        'subject_id',
        'department_id',
        'day_of_week',
        'start_time',
        'end_time',
        'room',
        'academic_year',
        'semester',
        'class_type',
        'max_students',
        'is_recurring',
        'is_active',
        'effective_from',
        'effective_to',
        'notes',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'max_students' => 'integer',
        'is_recurring' => 'boolean',
        'is_active' => 'boolean',
        'effective_from' => 'date',
        'effective_to' => 'date',
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
}
