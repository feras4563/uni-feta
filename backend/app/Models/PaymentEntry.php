<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PaymentEntry extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'payment_mode_id',
        'party_type',
        'party_id',
        'payment_type',
        'amount',
        'payment_date',
        'reference_number',
        'remarks',
        'journal_entry_id',
        'is_posted',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'is_posted' => 'boolean',
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

    public function paymentMode()
    {
        return $this->belongsTo(PaymentMode::class);
    }

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function party()
    {
        return $this->morphTo('party', 'party_type', 'party_id');
    }
}
