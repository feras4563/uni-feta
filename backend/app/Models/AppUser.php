<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AppUser extends Model
{
    use HasUuids;

    protected $fillable = [
        'auth_user_id',
        'email',
        'full_name',
        'role',
        'status',
        'last_login',
        'created_by',
    ];

    protected $casts = [
        'last_login' => 'datetime',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(AppUser::class, 'created_by');
    }

    public function createdUsers()
    {
        return $this->hasMany(AppUser::class, 'created_by');
    }

    public function actionLogs()
    {
        return $this->hasMany(UserActionLog::class, 'user_id');
    }
}
