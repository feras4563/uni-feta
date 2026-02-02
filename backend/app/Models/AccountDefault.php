<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountDefault extends Model
{
    protected $fillable = [
        'category',
        'account_id',
        'description',
    ];

    /**
     * Get the account associated with this default
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
