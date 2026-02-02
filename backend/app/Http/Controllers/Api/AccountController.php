<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccountController extends Controller
{
    /**
     * Get all accounts with tree structure
     */
    public function index(Request $request)
    {
        $query = Account::query();

        // Filter by root type if provided
        if ($request->has('root_type')) {
            $query->where('root_account_type', $request->root_type);
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Get flat list or tree structure
        if ($request->boolean('tree')) {
            $accounts = $query->whereNull('parent_account_id')
                ->with('descendants')
                ->get()
                ->map(fn($account) => $account->getTreeStructure());
            
            return response()->json($accounts);
        }

        $accounts = $query->with('parent')->get();
        return response()->json($accounts);
    }

    /**
     * Get accounts that can be parents (group accounts)
     */
    public function getParentAccounts(Request $request)
    {
        $query = Account::query()->with('parent');

        // Filter by root type if provided
        if ($request->has('root_type')) {
            $query->where('root_account_type', $request->root_type);
        }

        // Only get group accounts (accounts that can have children)
        $query->where('is_group', true);

        $accounts = $query->orderBy('account_number')->get();

        // Format for dropdown
        $formatted = $accounts->map(function ($account) {
            return [
                'id' => $account->id,
                'value' => $account->id,
                'label' => $account->account_name . ' (' . $account->account_number . ')',
                'account_name' => $account->account_name,
                'account_number' => $account->account_number,
                'level' => $account->level,
                'root_account_type' => $account->root_account_type,
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Get a single account
     */
    public function show($id)
    {
        $account = Account::with(['parent', 'children'])->findOrFail($id);
        return response()->json($account);
    }

    /**
     * Create a new account
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50|unique:accounts,account_number',
            'account_type' => 'required|in:asset,liability,equity,revenue,expense',
            'root_account_type' => 'required|in:assets,liabilities,equity,revenue,expenses',
            'parent_account_id' => 'nullable|exists:accounts,id',
            'description' => 'nullable|string',
            'balance' => 'nullable|numeric',
            'is_active' => 'boolean',
            'is_group' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // If parent is specified, check if parent is a group account
        if ($request->parent_account_id) {
            $parent = Account::find($request->parent_account_id);
            if ($parent && !$parent->is_group) {
                return response()->json([
                    'error' => 'Cannot add sub-account to a detail account. Parent must be a group account.'
                ], 422);
            }
        }

        $account = Account::create($request->all());

        return response()->json([
            'message' => 'Account created successfully',
            'account' => $account->load('parent')
        ], 201);
    }

    /**
     * Update an account
     */
    public function update(Request $request, $id)
    {
        $account = Account::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'account_name' => 'sometimes|required|string|max:255',
            'account_number' => 'sometimes|required|string|max:50|unique:accounts,account_number,' . $id,
            'account_type' => 'sometimes|required|in:asset,liability,equity,revenue,expense',
            'root_account_type' => 'sometimes|required|in:assets,liabilities,equity,revenue,expenses',
            'parent_account_id' => 'nullable|exists:accounts,id',
            'description' => 'nullable|string',
            'balance' => 'nullable|numeric',
            'is_active' => 'boolean',
            'is_group' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Prevent setting parent to self or descendant
        if ($request->has('parent_account_id') && $request->parent_account_id) {
            $parent = Account::find($request->parent_account_id);
            if ($parent && $parent->ancestors()->contains($account->id)) {
                return response()->json([
                    'error' => 'Cannot set parent to a descendant account'
                ], 422);
            }
        }

        $account->update($request->all());

        return response()->json([
            'message' => 'Account updated successfully',
            'account' => $account->load('parent')
        ]);
    }

    /**
     * Delete an account
     */
    public function destroy($id)
    {
        try {
            $account = Account::findOrFail($id);
            $account->delete();

            return response()->json([
                'message' => 'Account deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get account tree structure
     */
    public function tree(Request $request)
    {
        $rootType = $request->get('root_type');

        $query = Account::whereNull('parent_account_id');

        if ($rootType) {
            $query->where('root_account_type', $rootType);
        }

        $accounts = $query->with('descendants')
            ->orderBy('account_number')
            ->get()
            ->map(fn($account) => $account->getTreeStructure());

        return response()->json($accounts);
    }

    /**
     * Get general ledger for an account
     */
    public function generalLedger(Request $request, $accountId)
    {
        $account = Account::findOrFail($accountId);

        // Get date range
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        // Get journal entry lines for this account
        $query = \DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entry_lines.account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->select(
                'journal_entries.id as entry_id',
                'journal_entries.entry_number',
                'journal_entries.entry_date',
                'journal_entries.entry_type',
                'journal_entries.reference_number',
                'journal_entry_lines.debit',
                'journal_entry_lines.credit',
                'journal_entry_lines.description'
            );

        if ($startDate) {
            $query->where('journal_entries.entry_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('journal_entries.entry_date', '<=', $endDate);
        }

        $transactions = $query->orderBy('journal_entries.entry_date')
            ->orderBy('journal_entries.entry_number')
            ->get();

        // Calculate running balance
        $runningBalance = 0;
        $transactions = $transactions->map(function($transaction) use (&$runningBalance) {
            $debit = floatval($transaction->debit);
            $credit = floatval($transaction->credit);
            $runningBalance += ($debit - $credit);
            
            return [
                'entry_id' => $transaction->entry_id,
                'entry_number' => $transaction->entry_number,
                'date' => $transaction->entry_date,
                'description' => $transaction->entry_type . ($transaction->description ? ' - ' . $transaction->description : ''),
                'reference' => $transaction->reference_number,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $runningBalance,
            ];
        });

        // Calculate totals
        $totalDebit = $transactions->sum('debit');
        $totalCredit = $transactions->sum('credit');

        return response()->json([
            'account' => [
                'id' => $account->id,
                'account_number' => $account->account_number,
                'account_name' => $account->account_name,
                'root_account_type' => $account->root_account_type,
            ],
            'transactions' => $transactions,
            'summary' => [
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'balance' => $totalDebit - $totalCredit,
                'transaction_count' => $transactions->count(),
            ],
        ]);
    }

    /**
     * Get general ledger summary for all accounts
     */
    public function generalLedgerSummary(Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $view = $request->get('view', 'summary'); // 'summary' or 'transactions'

        if ($view === 'transactions') {
            // Return all transactions
            $query = \DB::table('journal_entry_lines')
                ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
                ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
                ->where('journal_entries.status', 'posted')
                ->select(
                    'journal_entries.id as entry_id',
                    'journal_entries.entry_number',
                    'journal_entries.entry_date',
                    'journal_entries.entry_type',
                    'journal_entries.reference_number',
                    'journal_entry_lines.debit',
                    'journal_entry_lines.credit',
                    'journal_entry_lines.description',
                    'accounts.id as account_id',
                    'accounts.account_number',
                    'accounts.account_name',
                    'accounts.root_account_type'
                );

            if ($startDate) {
                $query->where('journal_entries.entry_date', '>=', $startDate);
            }

            if ($endDate) {
                $query->where('journal_entries.entry_date', '<=', $endDate);
            }

            $transactions = $query->orderBy('journal_entries.entry_date', 'desc')
                ->orderBy('journal_entries.entry_number', 'desc')
                ->get();

            return response()->json($transactions->map(function($transaction) {
                return [
                    'entry_id' => $transaction->entry_id,
                    'entry_number' => $transaction->entry_number,
                    'entry_date' => $transaction->entry_date,
                    'entry_type' => $transaction->entry_type,
                    'reference_number' => $transaction->reference_number,
                    'account_id' => $transaction->account_id,
                    'account_number' => $transaction->account_number,
                    'account_name' => $transaction->account_name,
                    'root_account_type' => $transaction->root_account_type,
                    'debit' => floatval($transaction->debit),
                    'credit' => floatval($transaction->credit),
                    'description' => $transaction->description,
                ];
            }));
        }

        // Get all detail accounts (non-group accounts)
        $accounts = Account::where('is_group', false)->get();

        $ledgerData = [];

        foreach ($accounts as $account) {
            // Get journal entry lines for this account
            $query = \DB::table('journal_entry_lines')
                ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
                ->where('journal_entry_lines.account_id', $account->id)
                ->where('journal_entries.status', 'posted');

            if ($startDate) {
                $query->where('journal_entries.entry_date', '>=', $startDate);
            }

            if ($endDate) {
                $query->where('journal_entries.entry_date', '<=', $endDate);
            }

            $totals = $query->selectRaw('
                SUM(journal_entry_lines.debit) as total_debit,
                SUM(journal_entry_lines.credit) as total_credit,
                COUNT(*) as transaction_count
            ')->first();

            $totalDebit = floatval($totals->total_debit ?? 0);
            $totalCredit = floatval($totals->total_credit ?? 0);
            $transactionCount = intval($totals->transaction_count ?? 0);

            // Only include accounts with transactions
            if ($transactionCount > 0) {
                $ledgerData[] = [
                    'id' => $account->id,
                    'account_number' => $account->account_number,
                    'account_name' => $account->account_name,
                    'root_account_type' => $account->root_account_type,
                    'total_debit' => $totalDebit,
                    'total_credit' => $totalCredit,
                    'balance' => $totalDebit - $totalCredit,
                    'transaction_count' => $transactionCount,
                ];
            }
        }

        return response()->json($ledgerData);
    }
}
