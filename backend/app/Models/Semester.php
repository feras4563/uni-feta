<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Semester extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'name_en',
        'code',
        'study_year_id',
        'start_date',
        'end_date',
        'is_current',
        'is_active',
        'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
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
    public function studyYear()
    {
        return $this->belongsTo(StudyYear::class);
    }

    public function studentGroups()
    {
        return $this->hasMany(StudentGroup::class);
    }

    public function departmentSemesterSubjects()
    {
        return $this->hasMany(DepartmentSemesterSubject::class);
    }

    public function studentSemesterRegistrations()
    {
        return $this->hasMany(StudentSemesterRegistration::class);
    }

    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class);
    }
}
