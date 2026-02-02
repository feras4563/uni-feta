<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'name_en',
        'email',
        'national_id_passport',
        'phone',
        'address',
        'department_id',
        'year',
        'status',
        'gender',
        'nationality',
        'birth_date',
        'enrollment_date',
        'sponsor_name',
        'sponsor_contact',
        'academic_history',
        'academic_score',
        'transcript_file',
        'qr_code',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'enrollment_date' => 'date',
        'academic_score' => 'decimal:2',
        'year' => 'integer',
    ];

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function semesterRegistrations()
    {
        return $this->hasMany(StudentSemesterRegistration::class);
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function grades()
    {
        return $this->hasMany(StudentGrade::class);
    }

    public function academicProgress()
    {
        return $this->hasOne(StudentAcademicProgress::class);
    }
}
