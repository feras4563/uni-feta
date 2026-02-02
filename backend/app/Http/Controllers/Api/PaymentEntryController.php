<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentEntry;
use App\Models\PaymentMode;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PaymentEntryController extends Controller
{
    /**
     * Get all payment entries
     */
    public function index(Request $request)
    {
        $query = PaymentEntry::with(['paymentMode.account', 'journalEntry']);

        // Filter by payment type
        if ($request->has('payment_type')) {
            $query->where('payment_type', $request->payment_type);
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->where('payment_date', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->where('payment_date', '<=', $request->to_date);
        }

        // Filter by party
        if ($request->has('party_type')) {
            $query->where('party_type', $request->party_type);
        }
        if ($request->has('party_id')) {
            $query->where('party_id', $request->party_id);
        }

        $paymentEntries = $query->orderBy('payment_date', 'desc')->get();

        return response()->json($paymentEntries);
    }

    /**
     * Get a single payment entry
     */
    public function show($id)
    {
        $paymentEntry = PaymentEntry::with(['paymentMode.account', 'journalEntry.lines.account'])
            ->findOrFail($id);
        return response()->json($paymentEntry);
    }

    /**
     * Create a new payment entry and generate journal entry
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_mode_id' => 'required|exists:payment_modes,id',
            'party_type' => 'required|string',
            'party_id' => 'required|string',
            'payment_type' => 'required|in:receive,pay',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'reference_number' => 'nullable|string',
            'remarks' => 'nullable|string',
            'party_account_id' => 'required|exists:accounts,id', // Account to debit/credit for the party
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Create payment entry
            $paymentEntry = PaymentEntry::create([
                'payment_mode_id' => $request->payment_mode_id,
                'party_type' => $request->party_type,
                'party_id' => $request->party_id,
                'payment_type' => $request->payment_type,
                'amount' => $request->amount,
                'payment_date' => $request->payment_date,
                'reference_number' => $request->reference_number,
                'remarks' => $request->remarks,
            ]);

            // Get payment mode with account
            $paymentMode = PaymentMode::with('account')->findOrFail($request->payment_mode_id);
            $partyAccount = Account::findOrFail($request->party_account_id);

            // Use the model's generateEntryNumber method instead of manual generation
            $entryNumber = JournalEntry::generateEntryNumber();

            // Create journal entry
            $journalEntry = JournalEntry::create([
                'entry_number' => $entryNumber,
                'entry_type' => $request->payment_type === 'receive' ? 'قيد قبض' : 'قيد دفع',
                'reference_number' => $request->reference_number,
                'entry_date' => $request->payment_date,
                'posting_date' => $request->payment_date,
                'notes' => $request->remarks,
                'status' => 'posted',
                'total_debit' => $request->amount,
                'total_credit' => $request->amount,
                'created_by' => auth()->id(),
                'posted_by' => auth()->id(),
                'posted_at' => now(),
            ]);

            // Create journal entry lines based on payment type
            if ($request->payment_type === 'receive') {
                // Debit: Payment mode account (Cash/Bank increases)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id' => $paymentMode->account_id,
                    'debit' => $request->amount,
                    'credit' => 0,
                    'description' => "قبض من {$request->party_type} - {$request->remarks}",
                    'line_number' => 1,
                ]);

                // Credit: Party account (Receivable/Revenue decreases or increases)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id' => $request->party_account_id,
                    'debit' => 0,
                    'credit' => $request->amount,
                    'description' => "قبض من {$request->party_type} - {$request->remarks}",
                    'line_number' => 2,
                ]);
            } else {
                // Pay
                // Debit: Party account (Payable/Expense increases or decreases)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id' => $request->party_account_id,
                    'debit' => $request->amount,
                    'credit' => 0,
                    'description' => "دفع إلى {$request->party_type} - {$request->remarks}",
                    'line_number' => 1,
                ]);

                // Credit: Payment mode account (Cash/Bank decreases)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id' => $paymentMode->account_id,
                    'debit' => 0,
                    'credit' => $request->amount,
                    'description' => "دفع إلى {$request->party_type} - {$request->remarks}",
                    'line_number' => 2,
                ]);
            }

            // Update payment entry with journal entry id
            $paymentEntry->update([
                'journal_entry_id' => $journalEntry->id,
                'is_posted' => true,
            ]);

            // Update account balances
            $this->updateAccountBalances($journalEntry);

            DB::commit();

            $paymentEntry->load(['paymentMode.account', 'journalEntry.lines.account']);

            return response()->json($paymentEntry, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Payment entry creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'message' => 'فشل في إنشاء قيد الدفع',
                'error' => $e->getMessage(),
                'details' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Update account balances based on journal entry
     */
    private function updateAccountBalances($journalEntry)
    {
        $lines = JournalEntryLine::where('journal_entry_id', $journalEntry->id)->get();

        foreach ($lines as $line) {
            $account = Account::find($line->account_id);
            if ($account) {
                $balanceChange = $line->debit - $line->credit;
                
                // For asset and expense accounts, debit increases balance
                // For liability, equity, and revenue accounts, credit increases balance
                if (in_array($account->root_account_type, ['assets', 'expenses'])) {
                    $account->balance += $balanceChange;
                } else {
                    $account->balance -= $balanceChange;
                }
                
                $account->save();
            }
        }
    }

    /**
     * Delete a payment entry
     */
    public function destroy($id)
    {
        $paymentEntry = PaymentEntry::findOrFail($id);

        if ($paymentEntry->is_posted && $paymentEntry->journal_entry_id) {
            return response()->json([
                'message' => 'لا يمكن حذف قيد دفع مرحّل. يجب إلغاء ترحيل القيد اليومي أولاً'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Delete associated journal entry if exists
            if ($paymentEntry->journal_entry_id) {
                $journalEntry = JournalEntry::find($paymentEntry->journal_entry_id);
                if ($journalEntry) {
                    JournalEntryLine::where('journal_entry_id', $journalEntry->id)->delete();
                    $journalEntry->delete();
                }
            }

            $paymentEntry->delete();

            DB::commit();

            return response()->json([
                'message' => 'تم حذف قيد الدفع بنجاح'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'فشل في حذف قيد الدفع',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
