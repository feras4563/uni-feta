<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DepartmentTransfer extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'student_id',
        'from_department_id',
        'to_department_id',
        'semester_id',
        'approved_by',
        'status',
        'reason',
        'admin_notes',
        'credits_transferred',
        'transferred_subjects',
        'completed_at',
    ];

    protected $casts = [
        'credits_transferred' => 'integer',
        'transferred_subjects' => 'array',
        'completed_at' => 'datetime',
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

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function fromDepartment()
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment()
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }
}
