<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StudyYear extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'name_en',
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
    public function semesters()
    {
        return $this->hasMany(Semester::class);
    }

    public function studentSemesterRegistrations()
    {
        return $this->hasMany(StudentSemesterRegistration::class);
    }

    public function studentAcademicProgress()
    {
        return $this->hasMany(StudentAcademicProgress::class, 'current_study_year_id');
    }
}
