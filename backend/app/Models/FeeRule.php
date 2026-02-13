<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class FeeRule extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'fee_definition_id',
        'department_id',
        'target_semester',
        'override_amount',
        'condition_type',
        'condition_value',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'target_semester' => 'integer',
        'override_amount' => 'decimal:3',
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

    public function feeDefinition()
    {
        return $this->belongsTo(FeeDefinition::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
