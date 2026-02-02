<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Room extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'room_number',
        'name',
        'name_en',
        'room_type',
        'capacity',
        'floor',
        'building',
        'equipment',
        'is_active',
        'description',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'floor' => 'integer',
        'equipment' => 'array',
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
    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class);
    }
}
