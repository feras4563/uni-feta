<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ClassSession extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'teacher_id',
        'subject_id',
        'department_id',
        'session_name',
        'session_date',
        'start_time',
        'end_time',
        'room',
        'qr_code_data',
        'qr_generated_at',
        'qr_expires_at',
        'qr_signature',
        'status',
        'max_students',
        'notes',
    ];

    protected $casts = [
        'session_date' => 'date',
        'qr_generated_at' => 'datetime',
        'qr_expires_at' => 'datetime',
        'max_students' => 'integer',
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

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class, 'session_id');
    }
}
