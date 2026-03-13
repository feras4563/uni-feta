<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Teacher extends Model
{
    use SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'campus_id',
        'name',
        'name_en',
        'email',
        'phone',
        'specialization',
        'department_id',
        'username',
        'password_hash',
        'is_active',
        'last_login',
        'auth_user_id',
        'qualification',
        'education_level',
        'credential_institution',
        'credential_date',
        'years_experience',
        'specializations',
        'teaching_hours',
        'academic_records',
        'basic_salary',
        'hourly_rate',
        'bio',
        'office_location',
        'office_hours',
        'photo_url',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login' => 'datetime',
        'years_experience' => 'integer',
        'credential_date' => 'date',
        'teaching_hours' => 'integer',
        'specializations' => 'array',
        'basic_salary' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            
            if (empty($model->campus_id)) {
                $model->campus_id = self::generateCampusId();
            }
        });
    }

    /**
     * Generate next available campus ID for teachers
     */
    private static function generateCampusId(): string
    {
        $lastTeacher = self::where('campus_id', 'like', 'T%')
            ->orderBy('campus_id', 'desc')
            ->first();

        if ($lastTeacher && $lastTeacher->campus_id) {
            $lastNumber = (int) substr($lastTeacher->campus_id, 1);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return 'T' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
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

    public function headOfDepartments()
    {
        return $this->hasMany(Department::class, 'head_teacher_id');
    }

    public function authUser()
    {
        return $this->belongsTo(User::class, 'auth_user_id');
    }
}
