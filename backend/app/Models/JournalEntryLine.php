<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalEntryLine extends Model
{
    protected $fillable = [
        'journal_entry_id',
        'account_id',
        'debit',
        'credit',
        'description',
        'line_number',
    ];

    protected $casts = [
        'debit' => 'decimal:3',
        'credit' => 'decimal:3',
    ];

    /**
     * Get the journal entry that owns the line
     */
    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    /**
     * Get the account for this line
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
