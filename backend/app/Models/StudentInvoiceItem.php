<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StudentInvoiceItem extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'invoice_id',
        'subject_id',
        'enrollment_id',
        'fee_definition_id',
        'description',
        'quantity',
        'unit_price',
        'amount',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:3',
        'amount' => 'decimal:3',
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

    public function invoice()
    {
        return $this->belongsTo(StudentInvoice::class, 'invoice_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(StudentSubjectEnrollment::class, 'enrollment_id');
    }

    public function feeDefinition()
    {
        return $this->belongsTo(FeeDefinition::class);
    }
}
