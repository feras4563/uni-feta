<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class FeeDefinition extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name_ar',
        'name_en',
        'default_amount',
        'is_refundable',
        'frequency',
        'is_active',
        'description',
        'gl_account_id',
    ];

    protected $casts = [
        'default_amount' => 'decimal:3',
        'is_refundable' => 'boolean',
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

    public function rules()
    {
        return $this->hasMany(FeeRule::class);
    }

    public function invoiceItems()
    {
        return $this->hasMany(StudentInvoiceItem::class);
    }

    public function glAccount()
    {
        return $this->belongsTo(Account::class, 'gl_account_id');
    }
}
