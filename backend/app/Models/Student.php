<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class Student extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'campus_id',
        'name',
        'name_en',
        'email',
        'national_id_passport',
        'phone',
        'address',
        'department_id',
        'specialization_track',
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
        'photo_url',
        'birth_place',
        'certification_type',
        'certification_date',
        'certification_school',
        'certification_specialization',
        'port_of_entry',
        'visa_type',
        'mother_name',
        'mother_nationality',
        'passport_number',
        'passport_issue_date',
        'passport_expiry_date',
        'passport_place_of_issue',
        'auth_user_id',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'enrollment_date' => 'date',
        'certification_date' => 'date',
        'passport_issue_date' => 'date',
        'passport_expiry_date' => 'date',
        'academic_score' => 'decimal:2',
        'year' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($student) {
            if (empty($student->id)) {
                $student->id = (string) Str::uuid();
            }
            
            if (empty($student->campus_id)) {
                $student->campus_id = self::generateCampusId();
            }
        });
    }

    /**
     * Generate next available campus ID for students
     */
    private static function generateCampusId(): string
    {
        $lastStudent = self::where('campus_id', 'like', 'S%')
            ->orderBy('campus_id', 'desc')
            ->first();

        if ($lastStudent && $lastStudent->campus_id) {
            $lastNumber = (int) substr($lastStudent->campus_id, 1);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return 'S' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

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

    public function subjectEnrollments()
    {
        return $this->hasMany(StudentSubjectEnrollment::class);
    }

    public function academicProgress()
    {
        return $this->hasOne(StudentAcademicProgress::class);
    }

    public function authUser()
    {
        return $this->belongsTo(User::class, 'auth_user_id');
    }

    public function invoices()
    {
        return $this->hasMany(StudentInvoice::class);
    }
}
