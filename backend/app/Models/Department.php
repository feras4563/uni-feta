<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

class Department extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'name_en',
        'description',
        'head',
        'head_teacher_id',
        'semester_count',
        'is_locked',
        'is_active',
    ];

    protected $casts = [
        'semester_count' => 'integer',
        'is_locked' => 'boolean',
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
    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function teachers()
    {
        return $this->hasMany(Teacher::class);
    }

    public function headTeacher()
    {
        return $this->belongsTo(Teacher::class, 'head_teacher_id');
    }

    public function studentGroups()
    {
        return $this->hasMany(StudentGroup::class);
    }

    public function subjectDepartments()
    {
        return $this->hasMany(SubjectDepartment::class);
    }

    public function departmentSemesterSubjects()
    {
        return $this->hasMany(DepartmentSemesterSubject::class);
    }

    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class);
    }

    public function studentSemesterRegistrations()
    {
        return $this->hasMany(StudentSemesterRegistration::class);
    }

    public function studentAcademicProgress()
    {
        return $this->hasMany(StudentAcademicProgress::class);
    }
}
