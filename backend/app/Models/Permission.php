<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Permission extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'role',
        'resource',
        'actions',
    ];

    protected $casts = [
        'actions' => 'array',
        'created_at' => 'datetime',
    ];
}
