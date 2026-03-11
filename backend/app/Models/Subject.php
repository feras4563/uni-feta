<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Subject extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'name_en',
        'code',
        'description',
        'credits',
        'weekly_hours',
        'theoretical_hours',
        'practical_hours',
        'department_id',
        'cost_per_credit',
        'is_required',
        'subject_type',
        'semester_number',
        'semester',
        'semester_id',
        'prerequisites',
        'min_units_required',
        'teacher_id',
        'max_students',
        'pdf_file_url',
        'pdf_file_name',
        'pdf_file_size',
        'is_active',
    ];

    protected $casts = [
        'credits' => 'integer',
        'weekly_hours' => 'integer',
        'theoretical_hours' => 'integer',
        'practical_hours' => 'integer',
        'cost_per_credit' => 'decimal:2',
        'is_required' => 'boolean',
        'semester_number' => 'integer',
        'prerequisites' => 'array',
        'min_units_required' => 'integer',
        'max_students' => 'integer',
        'pdf_file_size' => 'integer',
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

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function subjectDepartments()
    {
        return $this->hasMany(SubjectDepartment::class);
    }

    public function departments()
    {
        return $this->belongsToMany(Department::class, 'subject_departments')
            ->withPivot('is_primary_department', 'is_active')
            ->withTimestamps();
    }

    public function departmentSemesterSubjects()
    {
        return $this->hasMany(DepartmentSemesterSubject::class);
    }

    public function teacherSubjects()
    {
        return $this->hasMany(TeacherSubject::class);
    }

    public function classSessions()
    {
        return $this->hasMany(ClassSession::class);
    }

    public function grades()
    {
        return $this->hasMany(StudentGrade::class);
    }

    public function classSchedules()
    {
        return $this->hasMany(ClassSchedule::class);
    }

    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class);
    }

    public function titles()
    {
        return $this->hasMany(SubjectTitle::class)->orderBy('order_index');
    }

    public function semesterRelation()
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function prerequisiteSubjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_prerequisites', 'subject_id', 'prerequisite_id')
            ->withTimestamps();
    }

    public function dependentSubjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_prerequisites', 'prerequisite_id', 'subject_id')
            ->withTimestamps();
    }

    public function subjectPrerequisites()
    {
        return $this->hasMany(SubjectPrerequisite::class);
    }
}
