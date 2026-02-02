<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SubjectDepartment extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'subject_id',
        'department_id',
        'is_primary_department',
        'is_active',
    ];

    protected $casts = [
        'is_primary_department' => 'boolean',
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
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
