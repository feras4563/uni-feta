<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalEntry extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'entry_number',
        'entry_type',
        'reference_number',
        'entry_date',
        'posting_date',
        'series',
        'company',
        'notes',
        'status',
        'total_debit',
        'total_credit',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'posting_date' => 'date',
        'posted_at' => 'datetime',
        'total_debit' => 'decimal:3',
        'total_credit' => 'decimal:3',
    ];

    /**
     * Get the lines for the journal entry
     */
    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class)->orderBy('line_number');
    }

    /**
     * Get the user who created the entry
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who posted the entry
     */
    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    /**
     * Generate the next entry number
     */
    public static function generateEntryNumber(): string
    {
        $year = date('Y');
        
        // Look for entries with both JE- and ACC-JV- prefixes
        $lastEntry = self::where('entry_number', 'like', '%-' . $year . '-%')
            ->orderByRaw('CAST(SUBSTRING_INDEX(entry_number, "-", -1) AS UNSIGNED) DESC')
            ->first();

        if ($lastEntry) {
            // Extract the last number from the entry_number (e.g., "00001" from "ACC-JV-2026-00001")
            preg_match('/-(\d+)$/', $lastEntry->entry_number, $matches);
            $lastNumber = isset($matches[1]) ? (int) $matches[1] : 0;
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return 'JE-' . $year . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Boot method to handle events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($entry) {
            if (empty($entry->entry_number)) {
                $entry->entry_number = self::generateEntryNumber();
            }
            if (empty($entry->created_by)) {
                $entry->created_by = auth()->id();
            }
        });

        // Update account balances when journal entry is created
        static::created(function ($entry) {
            if ($entry->status === 'posted') {
                $entry->updateAccountBalances();
            }
        });

        // Update account balances when journal entry is updated
        static::updated(function ($entry) {
            if ($entry->status === 'posted' && $entry->isDirty('status')) {
                $entry->updateAccountBalances();
            }
        });
    }

    /**
     * Update account balances based on journal entry lines
     */
    public function updateAccountBalances()
    {
        foreach ($this->lines as $line) {
            if ($line->account_id) {
                $account = Account::find($line->account_id);
                if ($account) {
                    // For assets and expenses: debit increases, credit decreases
                    // For liabilities, equity, and revenue: credit increases, debit decreases
                    if (in_array($account->account_type, ['asset', 'expense'])) {
                        $account->balance += ($line->debit - $line->credit);
                    } else {
                        $account->balance += ($line->credit - $line->debit);
                    }
                    $account->save();
                }
            }
        }
    }
}
