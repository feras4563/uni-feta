<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountingInvariantTest extends TestCase
{
    use RefreshDatabase;

    public function test_posted_journal_entry_has_balanced_debits_and_credits(): void
    {
        $cashAccount = Account::create([
            'account_number' => '1010',
            'account_name' => 'النقدية',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'is_active' => true,
            'is_group' => false,
        ]);

        $revenueAccount = Account::create([
            'account_number' => '4010',
            'account_name' => 'إيرادات الرسوم',
            'account_type' => 'revenue',
            'root_account_type' => 'income',
            'is_active' => true,
            'is_group' => false,
        ]);

        $entry = JournalEntry::create([
            'entry_type' => 'قيد يومية',
            'reference_number' => 'TEST-001',
            'entry_date' => now(),
            'posting_date' => now(),
            'notes' => 'Test entry',
            'status' => 'posted',
            'total_debit' => 500,
            'total_credit' => 500,
            'posted_at' => now(),
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $entry->id,
            'account_id' => $cashAccount->id,
            'debit' => 500,
            'credit' => 0,
            'description' => 'Cash received',
            'line_number' => 1,
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $entry->id,
            'account_id' => $revenueAccount->id,
            'debit' => 0,
            'credit' => 500,
            'description' => 'Revenue earned',
            'line_number' => 2,
        ]);

        // Verify the invariant: total debits == total credits
        $totalDebits = JournalEntryLine::where('journal_entry_id', $entry->id)->sum('debit');
        $totalCredits = JournalEntryLine::where('journal_entry_id', $entry->id)->sum('credit');

        $this->assertEquals($totalDebits, $totalCredits, 'Debits must equal credits for a posted journal entry');
    }

    public function test_global_debit_credit_balance_across_all_posted_entries(): void
    {
        $cashAccount = Account::create([
            'account_number' => '1010',
            'account_name' => 'النقدية',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'is_active' => true,
            'is_group' => false,
        ]);

        $receivableAccount = Account::create([
            'account_number' => '1210',
            'account_name' => 'المدينون',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'is_active' => true,
            'is_group' => false,
        ]);

        $revenueAccount = Account::create([
            'account_number' => '4010',
            'account_name' => 'إيرادات',
            'account_type' => 'revenue',
            'root_account_type' => 'income',
            'is_active' => true,
            'is_group' => false,
        ]);

        // Entry 1: Invoice (Debit Receivable, Credit Revenue)
        $entry1 = JournalEntry::create([
            'entry_type' => 'قيد يومية',
            'reference_number' => 'INV-001',
            'entry_date' => now(),
            'posting_date' => now(),
            'status' => 'posted',
            'total_debit' => 1000,
            'total_credit' => 1000,
            'posted_at' => now(),
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $entry1->id,
            'account_id' => $receivableAccount->id,
            'debit' => 1000,
            'credit' => 0,
            'line_number' => 1,
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $entry1->id,
            'account_id' => $revenueAccount->id,
            'debit' => 0,
            'credit' => 1000,
            'line_number' => 2,
        ]);

        // Entry 2: Payment (Debit Cash, Credit Receivable)
        $entry2 = JournalEntry::create([
            'entry_type' => 'قيد يومية',
            'reference_number' => 'PAY-001',
            'entry_date' => now(),
            'posting_date' => now(),
            'status' => 'posted',
            'total_debit' => 600,
            'total_credit' => 600,
            'posted_at' => now(),
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $entry2->id,
            'account_id' => $cashAccount->id,
            'debit' => 600,
            'credit' => 0,
            'line_number' => 1,
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $entry2->id,
            'account_id' => $receivableAccount->id,
            'debit' => 0,
            'credit' => 600,
            'line_number' => 2,
        ]);

        // Global invariant: across ALL posted entries, total debits == total credits
        $postedEntryIds = JournalEntry::where('status', 'posted')->pluck('id');
        $globalDebits = JournalEntryLine::whereIn('journal_entry_id', $postedEntryIds)->sum('debit');
        $globalCredits = JournalEntryLine::whereIn('journal_entry_id', $postedEntryIds)->sum('credit');

        $this->assertEquals(
            (float) $globalDebits,
            (float) $globalCredits,
            'Total debits must equal total credits across all posted journal entries'
        );

        // Also verify individual entry balance
        foreach ($postedEntryIds as $entryId) {
            $entryDebits = JournalEntryLine::where('journal_entry_id', $entryId)->sum('debit');
            $entryCredits = JournalEntryLine::where('journal_entry_id', $entryId)->sum('credit');
            $this->assertEquals(
                (float) $entryDebits,
                (float) $entryCredits,
                "Entry {$entryId} debits must equal credits"
            );
        }
    }

    public function test_draft_entries_are_excluded_from_balance_check(): void
    {
        $account = Account::create([
            'account_number' => '1010',
            'account_name' => 'النقدية',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'is_active' => true,
            'is_group' => false,
        ]);

        // Create a draft entry (intentionally unbalanced to prove it's excluded)
        $draft = JournalEntry::create([
            'entry_type' => 'قيد يومية',
            'reference_number' => 'DRAFT-001',
            'entry_date' => now(),
            'status' => 'draft',
            'total_debit' => 100,
            'total_credit' => 0,
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $draft->id,
            'account_id' => $account->id,
            'debit' => 100,
            'credit' => 0,
            'line_number' => 1,
        ]);

        // Only posted entries should be checked
        $postedEntryIds = JournalEntry::where('status', 'posted')->pluck('id');
        $globalDebits = JournalEntryLine::whereIn('journal_entry_id', $postedEntryIds)->sum('debit');
        $globalCredits = JournalEntryLine::whereIn('journal_entry_id', $postedEntryIds)->sum('credit');

        $this->assertEquals(
            (float) $globalDebits,
            (float) $globalCredits,
            'Draft entries should not affect the global balance invariant'
        );
    }
}
