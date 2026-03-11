<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AttendanceRecord extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'session_id',
        'student_id',
        'marked_by_id',
        'scan_time',
        'status',
        'student_qr_code',
        'class_qr_signature',
        'ip_address',
        'user_agent',
        'location_data',
        'is_manual_entry',
        'is_override',
        'notes',
    ];

    protected $casts = [
        'scan_time' => 'datetime',
        'location_data' => 'array',
        'is_manual_entry' => 'boolean',
        'is_override' => 'boolean',
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
    public function session()
    {
        return $this->belongsTo(ClassSession::class, 'session_id');
    }

    public function classSession()
    {
        return $this->belongsTo(ClassSession::class, 'session_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function markedBy()
    {
        return $this->belongsTo(User::class, 'marked_by_id');
    }
}
