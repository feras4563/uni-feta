<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class StudentGroup extends Model
{
    use SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'group_name',
        'department_id',
        'semester_id',
        'semester_number',
        'max_students',
        'current_students',
        'is_active',
        'description',
    ];

    protected $casts = [
        'semester_number' => 'integer',
        'max_students' => 'integer',
        'current_students' => 'integer',
        'is_active' => 'boolean',
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
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function studentSemesterRegistrations()
    {
        return $this->hasMany(StudentSemesterRegistration::class, 'group_id');
    }

    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class, 'group_id');
    }
}
