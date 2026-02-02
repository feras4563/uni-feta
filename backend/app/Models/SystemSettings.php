<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSettings extends Model
{
    protected $table = 'system_settings';

    protected $fillable = [
        'app_name',
        'app_logo_url',
        'app_logo_name',
        'theme_color',
        'language',
        'timezone',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
