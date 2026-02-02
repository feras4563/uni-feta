<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class JournalEntryController extends Controller
{
    /**
     * Display a listing of journal entries
     */
    public function index(Request $request)
    {
        $query = JournalEntry::with(['lines.account', 'creator']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('entry_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('entry_date', '<=', $request->end_date);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('entry_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $entries = $query->orderBy('entry_date', 'desc')
            ->orderBy('entry_number', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($entries);
    }

    /**
     * Store a newly created journal entry
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'entry_type' => 'required|string|max:255',
            'entry_date' => 'required|date',
            'posting_date' => 'required|date',
            'reference_number' => 'nullable|string|max:255',
            'series' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:accounts,id',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
            'lines.*.description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validate that accounts are not group accounts
        $accountIds = collect($request->lines)->pluck('account_id')->unique();
        $groupAccounts = Account::whereIn('id', $accountIds)->where('is_group', true)->get();
        
        if ($groupAccounts->count() > 0) {
            return response()->json([
                'error' => 'لا يمكن استخدام حسابات المجموعة في القيود. الحسابات التالية هي حسابات مجموعة: ' . 
                          $groupAccounts->pluck('account_name')->implode(', ')
            ], 422);
        }

        // Validate that each line has either debit or credit, not both
        foreach ($request->lines as $index => $line) {
            if ($line['debit'] > 0 && $line['credit'] > 0) {
                return response()->json([
                    'error' => "السطر " . ($index + 1) . ": لا يمكن أن يحتوي السطر على مدين ودائن في نفس الوقت"
                ], 422);
            }
            if ($line['debit'] == 0 && $line['credit'] == 0) {
                return response()->json([
                    'error' => "السطر " . ($index + 1) . ": يجب إدخال قيمة للمدين أو الدائن"
                ], 422);
            }
        }

        // Calculate totals
        $totalDebit = collect($request->lines)->sum('debit');
        $totalCredit = collect($request->lines)->sum('credit');

        // Validate balance
        if (abs($totalDebit - $totalCredit) > 0.001) {
            return response()->json([
                'error' => 'إجمالي المدين يجب أن يساوي إجمالي الدائن. المدين: ' . $totalDebit . '، الدائن: ' . $totalCredit
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create journal entry
            $entry = JournalEntry::create([
                'entry_type' => $request->entry_type,
                'reference_number' => $request->reference_number,
                'entry_date' => $request->entry_date,
                'posting_date' => $request->posting_date,
                'series' => $request->series ?? 'ACC-JV-YYYY',
                'company' => $request->company,
                'notes' => $request->notes,
                'status' => 'draft',
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
            ]);

            // Create journal entry lines
            foreach ($request->lines as $index => $lineData) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $lineData['account_id'],
                    'debit' => $lineData['debit'],
                    'credit' => $lineData['credit'],
                    'description' => $lineData['description'] ?? '',
                    'line_number' => $index + 1,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'تم إنشاء القيد بنجاح',
                'data' => $entry->load('lines.account')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'حدث خطأ أثناء إنشاء القيد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified journal entry
     */
    public function show($id)
    {
        $entry = JournalEntry::with(['lines.account', 'creator', 'poster'])->findOrFail($id);
        return response()->json($entry);
    }

    /**
     * Update the specified journal entry
     */
    public function update(Request $request, $id)
    {
        $entry = JournalEntry::findOrFail($id);

        // Only draft entries can be updated
        if ($entry->status !== 'draft') {
            return response()->json([
                'error' => 'لا يمكن تعديل القيود المرحلة أو الملغاة'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'entry_type' => 'required|string|max:255',
            'entry_date' => 'required|date',
            'posting_date' => 'required|date',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:accounts,id',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
            'lines.*.description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Calculate totals
        $totalDebit = collect($request->lines)->sum('debit');
        $totalCredit = collect($request->lines)->sum('credit');

        // Validate balance
        if (abs($totalDebit - $totalCredit) > 0.001) {
            return response()->json([
                'error' => 'إجمالي المدين يجب أن يساوي إجمالي الدائن'
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Update journal entry
            $entry->update([
                'entry_type' => $request->entry_type,
                'reference_number' => $request->reference_number,
                'entry_date' => $request->entry_date,
                'posting_date' => $request->posting_date,
                'notes' => $request->notes,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
            ]);

            // Delete old lines and create new ones
            $entry->lines()->delete();

            foreach ($request->lines as $index => $lineData) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $lineData['account_id'],
                    'debit' => $lineData['debit'],
                    'credit' => $lineData['credit'],
                    'description' => $lineData['description'] ?? '',
                    'line_number' => $index + 1,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'تم تحديث القيد بنجاح',
                'data' => $entry->load('lines.account')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'حدث خطأ أثناء تحديث القيد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Post (finalize) a journal entry
     */
    public function post($id)
    {
        $entry = JournalEntry::findOrFail($id);

        if ($entry->status !== 'draft') {
            return response()->json([
                'error' => 'يمكن ترحيل القيود في حالة المسودة فقط'
            ], 422);
        }

        try {
            $entry->update([
                'status' => 'posted',
                'posted_by' => auth()->id(),
                'posted_at' => now(),
            ]);

            return response()->json([
                'message' => 'تم ترحيل القيد بنجاح',
                'data' => $entry
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'حدث خطأ أثناء ترحيل القيد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a journal entry
     */
    public function cancel($id)
    {
        $entry = JournalEntry::findOrFail($id);

        if ($entry->status === 'cancelled') {
            return response()->json([
                'error' => 'القيد ملغى بالفعل'
            ], 422);
        }

        try {
            $entry->update([
                'status' => 'cancelled',
            ]);

            return response()->json([
                'message' => 'تم إلغاء القيد بنجاح',
                'data' => $entry
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'حدث خطأ أثناء إلغاء القيد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified journal entry
     */
    public function destroy($id)
    {
        $entry = JournalEntry::findOrFail($id);

        // Only draft entries can be deleted
        if ($entry->status !== 'draft') {
            return response()->json([
                'error' => 'لا يمكن حذف القيود المرحلة أو الملغاة'
            ], 422);
        }

        try {
            $entry->delete();

            return response()->json([
                'message' => 'تم حذف القيد بنجاح'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'حدث خطأ أثناء حذف القيد: ' . $e->getMessage()
            ], 500);
        }
    }
}
