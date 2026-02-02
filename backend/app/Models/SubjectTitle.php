<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubjectTitle extends Model
{
    protected $fillable = [
        'subject_id',
        'title',
        'title_en',
        'description',
        'order_index',
    ];

    protected $casts = [
        'order_index' => 'integer',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
