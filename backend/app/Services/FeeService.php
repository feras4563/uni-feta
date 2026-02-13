<?php

namespace App\Services;

use App\Models\FeeDefinition;
use App\Models\FeeRule;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\StudentInvoiceItem;
use App\Models\StudentSubjectEnrollment;
use App\Models\AccountDefault;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use Illuminate\Support\Facades\DB;

class FeeService
{
    /**
     * Get all applicable fee definitions for a student based on context.
     * Returns array of ['fee_definition_id', 'name_ar', 'name_en', 'amount', 'frequency', 'is_refundable']
     */
    public static function getApplicableFeesForStudent(
        string $departmentId,
        int $semesterNumber,
        int $totalCredits,
        Student $student
    ): array {
        $feeDefinitions = FeeDefinition::where('is_active', true)
            ->with(['rules' => function ($q) {
                $q->where('is_active', true);
            }])
            ->get();

        $applicableFees = [];

        foreach ($feeDefinitions as $feeDef) {
            $rules = $feeDef->rules;

            // If no rules exist, the fee applies globally with default amount
            if ($rules->isEmpty()) {
                $applicableFees[] = [
                    'fee_definition_id' => $feeDef->id,
                    'name_ar' => $feeDef->name_ar,
                    'name_en' => $feeDef->name_en,
                    'amount' => (float) $feeDef->default_amount,
                    'frequency' => $feeDef->frequency,
                    'is_refundable' => $feeDef->is_refundable,
                ];
                continue;
            }

            // Check if any rule matches
            foreach ($rules as $rule) {
                $matches = true;

                // Check department
                if ($rule->department_id && $rule->department_id !== $departmentId) {
                    $matches = false;
                }

                // Check semester
                if ($rule->target_semester && $rule->target_semester != $semesterNumber) {
                    $matches = false;
                }

                // Check conditions
                if ($matches && $rule->condition_type && $rule->condition_type !== 'none') {
                    switch ($rule->condition_type) {
                        case 'total_credits_gt':
                            if ($totalCredits <= (int) $rule->condition_value) {
                                $matches = false;
                            }
                            break;
                        case 'total_credits_lt':
                            if ($totalCredits >= (int) $rule->condition_value) {
                                $matches = false;
                            }
                            break;
                        case 'student_year_eq':
                            if ($student->year != (int) $rule->condition_value) {
                                $matches = false;
                            }
                            break;
                        case 'nationality_eq':
                            if (!$student->nationality || strtolower($student->nationality) !== strtolower($rule->condition_value)) {
                                $matches = false;
                            }
                            break;
                    }
                }

                if ($matches) {
                    $applicableFees[] = [
                        'fee_definition_id' => $feeDef->id,
                        'name_ar' => $feeDef->name_ar,
                        'name_en' => $feeDef->name_en,
                        'amount' => (float) ($rule->override_amount ?? $feeDef->default_amount),
                        'frequency' => $feeDef->frequency,
                        'is_refundable' => $feeDef->is_refundable,
                    ];
                    break; // First matching rule wins for this fee definition
                }
            }
        }

        return $applicableFees;
    }

    /**
     * Get fee_definition_ids that have already been charged to a student in a given semester.
     * Checks across ALL invoices for the student+semester to prevent duplicates.
     */
    public static function getAlreadyChargedFeeDefinitionIds(
        string $studentId,
        string $semesterId
    ): array {
        return StudentInvoiceItem::whereHas('invoice', function ($q) use ($studentId, $semesterId) {
            $q->where('student_id', $studentId)
              ->where('semester_id', $semesterId)
              ->whereNotIn('status', ['cancelled']);
        })
        ->whereNotNull('fee_definition_id')
        ->pluck('fee_definition_id')
        ->unique()
        ->toArray();
    }

    /**
     * Calculate new fees to charge (applicable minus already charged).
     * For 'one_time' fees, also checks ALL semesters (charged once ever).
     * For 'annual' fees, checks all semesters in the same study year.
     */
    public static function getNewFeesToCharge(
        string $studentId,
        string $semesterId,
        string $departmentId,
        int $semesterNumber,
        int $totalCredits,
        Student $student,
        ?string $studyYearId = null
    ): array {
        $applicableFees = self::getApplicableFeesForStudent(
            $departmentId,
            $semesterNumber,
            $totalCredits,
            $student
        );

        if (empty($applicableFees)) {
            return [];
        }

        // Get already charged fees for this semester
        $chargedInSemester = self::getAlreadyChargedFeeDefinitionIds($studentId, $semesterId);

        // Get one_time fees charged in ANY semester (ever)
        $chargedOneTime = StudentInvoiceItem::whereHas('invoice', function ($q) use ($studentId) {
            $q->where('student_id', $studentId)
              ->whereNotIn('status', ['cancelled']);
        })
        ->whereNotNull('fee_definition_id')
        ->whereHas('feeDefinition', function ($q) {
            $q->where('frequency', 'one_time');
        })
        ->pluck('fee_definition_id')
        ->unique()
        ->toArray();

        // Get annual fees charged in the same study year
        $chargedAnnual = [];
        if ($studyYearId) {
            $chargedAnnual = StudentInvoiceItem::whereHas('invoice', function ($q) use ($studentId, $studyYearId) {
                $q->where('student_id', $studentId)
                  ->where('study_year_id', $studyYearId)
                  ->whereNotIn('status', ['cancelled']);
            })
            ->whereNotNull('fee_definition_id')
            ->whereHas('feeDefinition', function ($q) {
                $q->where('frequency', 'annual');
            })
            ->pluck('fee_definition_id')
            ->unique()
            ->toArray();
        }

        $newFees = [];
        foreach ($applicableFees as $fee) {
            $feeDefId = $fee['fee_definition_id'];

            // Skip if already charged based on frequency rules
            if ($fee['frequency'] === 'one_time' && in_array($feeDefId, $chargedOneTime)) {
                continue;
            }
            if ($fee['frequency'] === 'annual' && in_array($feeDefId, $chargedAnnual)) {
                continue;
            }
            if (in_array($feeDefId, $chargedInSemester)) {
                continue;
            }

            $newFees[] = $fee;
        }

        return $newFees;
    }

    /**
     * Find or create a pending/partial invoice for a student in a semester.
     * Reuses existing non-paid invoice to avoid duplicates.
     */
    public static function findOrCreateInvoice(
        string $studentId,
        string $semesterId,
        string $studyYearId,
        string $departmentId,
        int $semesterNumber,
        bool $isPaying = false
    ): StudentInvoice {
        // Try to find an existing non-paid, non-cancelled invoice for this semester
        $existingInvoice = StudentInvoice::where('student_id', $studentId)
            ->where('semester_id', $semesterId)
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->first();

        if ($existingInvoice) {
            return $existingInvoice;
        }

        // Create new invoice
        return StudentInvoice::create([
            'student_id' => $studentId,
            'semester_id' => $semesterId,
            'study_year_id' => $studyYearId,
            'department_id' => $departmentId,
            'semester_number' => $semesterNumber,
            'invoice_date' => now(),
            'due_date' => now()->addDays(30),
            'subtotal' => 0,
            'discount' => 0,
            'discount_type' => 'none',
            'tax' => 0,
            'total_amount' => 0,
            'paid_amount' => 0,
            'balance' => 0,
            'status' => 'pending',
        ]);
    }

    /**
     * Add subject enrollment items to an invoice.
     */
    public static function addSubjectItemsToInvoice(
        StudentInvoice $invoice,
        array $enrollments,
        array $subjects
    ): float {
        $subjectTotal = 0;

        foreach ($enrollments as $index => $enrollment) {
            $subject = $subjects[$index] ?? null;
            if (!$subject) continue;

            $amount = $subject->credits * $subject->cost_per_credit;
            $subjectTotal += $amount;

            StudentInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'subject_id' => $subject->id,
                'enrollment_id' => $enrollment->id,
                'description' => $subject->name . ' - ' . $subject->code,
                'quantity' => $subject->credits,
                'unit_price' => $subject->cost_per_credit,
                'amount' => $amount,
            ]);
        }

        return $subjectTotal;
    }

    /**
     * Add fee definition items to an invoice (non-subject fees like registration, etc.)
     */
    public static function addFeeItemsToInvoice(
        StudentInvoice $invoice,
        array $fees,
        int $totalCredits = 0
    ): float {
        $feesTotal = 0;

        foreach ($fees as $fee) {
            $feeAmount = (float) $fee['amount'];
            $quantity = 1;
            $unitPrice = (float) $fee['amount'];

            if ($fee['frequency'] === 'per_credit') {
                $quantity = $totalCredits;
                $feeAmount = (float) $fee['amount'] * $totalCredits;
            }

            $feesTotal += $feeAmount;

            StudentInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'subject_id' => null,
                'fee_definition_id' => $fee['fee_definition_id'],
                'description' => $fee['name_ar'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'amount' => $feeAmount,
            ]);
        }

        return $feesTotal;
    }

    /**
     * Recalculate invoice totals from its items and discount.
     */
    public static function recalculateInvoice(StudentInvoice $invoice): StudentInvoice
    {
        $subtotal = StudentInvoiceItem::where('invoice_id', $invoice->id)->sum('amount');

        $discount = 0;
        if ($invoice->discount_type === 'percentage' && $invoice->discount_percentage > 0) {
            $discount = $subtotal * ($invoice->discount_percentage / 100);
        } elseif ($invoice->discount_type === 'fixed') {
            $discount = (float) $invoice->discount;
        } elseif ($invoice->discount_type === 'full_waiver') {
            $discount = $subtotal;
        }

        $totalAmount = max(0, $subtotal - $discount);
        $balance = max(0, $totalAmount - (float) $invoice->paid_amount);

        // Determine status
        $status = 'pending';
        if ($totalAmount == 0 || $balance == 0) {
            $status = 'paid';
        } elseif ((float) $invoice->paid_amount > 0) {
            $status = 'partial';
        }

        $invoice->update([
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total_amount' => $totalAmount,
            'balance' => $balance,
            'status' => $status,
        ]);

        return $invoice->fresh();
    }

    /**
     * Apply a discount/waiver to an invoice.
     */
    public static function applyDiscount(
        string $invoiceId,
        string $discountType,
        ?float $discountValue,
        ?string $reason,
        ?string $approvedBy
    ): StudentInvoice {
        $invoice = StudentInvoice::findOrFail($invoiceId);

        $updateData = [
            'discount_type' => $discountType,
            'discount_reason' => $reason,
            'discount_approved_by' => $approvedBy,
        ];

        if ($discountType === 'percentage') {
            $updateData['discount_percentage'] = $discountValue;
        } elseif ($discountType === 'fixed') {
            $updateData['discount'] = $discountValue;
        } elseif ($discountType === 'full_waiver') {
            $updateData['discount_percentage'] = null;
        } elseif ($discountType === 'none') {
            $updateData['discount'] = 0;
            $updateData['discount_percentage'] = null;
        }

        $invoice->update($updateData);

        // Recalculate totals
        $invoice = self::recalculateInvoice($invoice);

        // If discount results in fully waived, create journal entry for reversal
        if ($invoice->status === 'paid' && $discountType !== 'none') {
            self::createDiscountJournalEntry($invoice);
        }

        return $invoice;
    }

    /**
     * Remove discount from an invoice.
     */
    public static function removeDiscount(string $invoiceId): StudentInvoice
    {
        return self::applyDiscount($invoiceId, 'none', null, null, null);
    }

    /**
     * Create journal entry for discount/waiver.
     */
    protected static function createDiscountJournalEntry(StudentInvoice $invoice): void
    {
        $discountAmount = (float) $invoice->discount;
        if ($discountAmount <= 0) return;

        $receivableAccount = AccountDefault::where('category', 'accounts_receivable')->first();
        $revenueAccount = AccountDefault::where('category', 'sales_revenue')->first();

        if (!$receivableAccount || !$revenueAccount) return;

        $journalEntry = JournalEntry::create([
            'entry_type' => 'قيد يومية',
            'reference_number' => $invoice->invoice_number . '-DSC',
            'entry_date' => now(),
            'posting_date' => now(),
            'notes' => 'خصم/إعفاء على فاتورة: ' . $invoice->invoice_number . ' - ' . ($invoice->discount_reason ?? ''),
            'status' => 'posted',
            'total_debit' => $discountAmount,
            'total_credit' => $discountAmount,
            'posted_at' => now(),
        ]);

        // Debit: Revenue (reducing revenue)
        JournalEntryLine::create([
            'journal_entry_id' => $journalEntry->id,
            'account_id' => $revenueAccount->account_id,
            'debit' => $discountAmount,
            'credit' => 0,
            'description' => 'خصم/إعفاء - ' . $invoice->student->name,
            'line_number' => 1,
        ]);

        // Credit: Accounts Receivable (reducing receivable)
        JournalEntryLine::create([
            'journal_entry_id' => $journalEntry->id,
            'account_id' => $receivableAccount->account_id,
            'debit' => 0,
            'credit' => $discountAmount,
            'description' => 'تخفيض مستحقات بسبب خصم/إعفاء - ' . $invoice->student->name,
            'line_number' => 2,
        ]);
    }

    /**
     * Check and apply any pending fees for a student in a semester.
     * Used to retroactively apply new fee definitions to existing students.
     */
    public static function checkAndApplyPendingFees(
        string $studentId,
        string $semesterId,
        ?string $departmentId = null,
        ?int $semesterNumber = null,
        ?string $studyYearId = null
    ): array {
        $student = Student::findOrFail($studentId);

        // If department/semester not provided, get from semester registration
        if (!$departmentId || !$semesterNumber || !$studyYearId) {
            $registration = \App\Models\StudentSemesterRegistration::where('student_id', $studentId)
                ->where('semester_id', $semesterId)
                ->first();

            if (!$registration) {
                return ['applied' => [], 'message' => 'لم يتم العثور على تسجيل للطالب في هذا الفصل'];
            }

            $departmentId = $departmentId ?? $registration->department_id;
            $semesterNumber = $semesterNumber ?? $registration->semester_number;
            $studyYearId = $studyYearId ?? $registration->study_year_id;
        }

        // Get total credits for this semester
        $totalCredits = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('semester_id', $semesterId)
            ->whereHas('subject')
            ->with('subject')
            ->get()
            ->sum(function ($enrollment) {
                return $enrollment->subject->credits ?? 0;
            });

        // Get fees that should be charged but haven't been
        $newFees = self::getNewFeesToCharge(
            $studentId,
            $semesterId,
            $departmentId,
            $semesterNumber,
            $totalCredits,
            $student,
            $studyYearId
        );

        if (empty($newFees)) {
            return ['applied' => [], 'message' => 'لا توجد رسوم معلقة'];
        }

        // Find or create invoice
        $invoice = self::findOrCreateInvoice(
            $studentId,
            $semesterId,
            $studyYearId,
            $departmentId,
            $semesterNumber
        );

        // Add fee items
        $feesTotal = self::addFeeItemsToInvoice($invoice, $newFees, $totalCredits);

        // Recalculate invoice totals
        self::recalculateInvoice($invoice);

        // Update journal entry if exists
        self::updateOrCreateInvoiceJournalEntry($invoice);

        return [
            'applied' => $newFees,
            'fees_total' => $feesTotal,
            'invoice' => $invoice->fresh(['items.subject', 'items.feeDefinition']),
            'message' => 'تم تطبيق ' . count($newFees) . ' رسم(رسوم) على الفاتورة',
        ];
    }

    /**
     * Update or create the journal entry for an invoice's current total.
     * Creates separate credit lines per fee definition GL account when available.
     */
    public static function updateOrCreateInvoiceJournalEntry(StudentInvoice $invoice): void
    {
        $receivableAccount = AccountDefault::where('category', 'accounts_receivable')->first();
        $defaultRevenueAccount = AccountDefault::where('category', 'sales_revenue')->first();

        if (!$receivableAccount || !$defaultRevenueAccount) return;

        $totalAmount = (float) $invoice->total_amount;
        $student = $invoice->student;

        // Build credit lines grouped by GL account
        $creditLines = self::buildJournalCreditLines($invoice, $defaultRevenueAccount->account_id, $student->name);

        if ($invoice->journal_entry_id) {
            $journalEntry = JournalEntry::find($invoice->journal_entry_id);
            if ($journalEntry) {
                $journalEntry->update([
                    'total_debit' => $totalAmount,
                    'total_credit' => $totalAmount,
                ]);

                JournalEntryLine::where('journal_entry_id', $journalEntry->id)->delete();

                // Debit: Accounts Receivable
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id' => $receivableAccount->account_id,
                    'debit' => $totalAmount,
                    'credit' => 0,
                    'description' => 'رسوم دراسية - ' . $student->name,
                    'line_number' => 1,
                ]);

                // Credit lines per GL account
                $lineNum = 2;
                foreach ($creditLines as $line) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'account_id' => $line['account_id'],
                        'debit' => 0,
                        'credit' => $line['amount'],
                        'description' => $line['description'],
                        'line_number' => $lineNum++,
                    ]);
                }
            }
        } else {
            $journalEntry = JournalEntry::create([
                'entry_type' => 'قيد يومية',
                'reference_number' => $invoice->invoice_number,
                'entry_date' => now(),
                'posting_date' => now(),
                'notes' => 'تسجيل رسوم دراسية للطالب: ' . $student->name,
                'status' => 'posted',
                'total_debit' => $totalAmount,
                'total_credit' => $totalAmount,
                'posted_at' => now(),
            ]);

            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $receivableAccount->account_id,
                'debit' => $totalAmount,
                'credit' => 0,
                'description' => 'رسوم دراسية - ' . $student->name,
                'line_number' => 1,
            ]);

            $lineNum = 2;
            foreach ($creditLines as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id' => $line['account_id'],
                    'debit' => 0,
                    'credit' => $line['amount'],
                    'description' => $line['description'],
                    'line_number' => $lineNum++,
                ]);
            }

            $invoice->update(['journal_entry_id' => $journalEntry->id]);
        }
    }

    /**
     * Build credit lines for journal entry, grouping by GL account.
     * Fee items with a specific gl_account_id get their own line.
     * Subject items and fee items without gl_account_id go to the default revenue account.
     */
    protected static function buildJournalCreditLines(StudentInvoice $invoice, int $defaultRevenueAccountId, string $studentName): array
    {
        $items = StudentInvoiceItem::where('invoice_id', $invoice->id)
            ->with('feeDefinition')
            ->get();

        $grouped = [];

        foreach ($items as $item) {
            $glAccountId = null;
            $description = '';

            if ($item->fee_definition_id && $item->feeDefinition && $item->feeDefinition->gl_account_id) {
                $glAccountId = $item->feeDefinition->gl_account_id;
                $description = $item->feeDefinition->name_ar . ' - ' . $studentName;
            } else {
                $glAccountId = $defaultRevenueAccountId;
                $description = 'إيرادات رسوم دراسية - ' . $studentName;
            }

            if (!isset($grouped[$glAccountId])) {
                $grouped[$glAccountId] = [
                    'account_id' => $glAccountId,
                    'amount' => 0,
                    'description' => $description,
                ];
            }
            $grouped[$glAccountId]['amount'] += (float) $item->amount;
        }

        // If no items, fall back to total amount on default account
        if (empty($grouped)) {
            $grouped[$defaultRevenueAccountId] = [
                'account_id' => $defaultRevenueAccountId,
                'amount' => (float) $invoice->total_amount,
                'description' => 'إيرادات رسوم دراسية - ' . $studentName,
            ];
        }

        return array_values($grouped);
    }

    /**
     * Get a summary of all fees for a student in a semester (charged + pending).
     */
    public static function getStudentFeeSummary(
        string $studentId,
        string $semesterId
    ): array {
        $student = Student::findOrFail($studentId);

        // Get registration info
        $registration = \App\Models\StudentSemesterRegistration::where('student_id', $studentId)
            ->where('semester_id', $semesterId)
            ->first();

        if (!$registration) {
            return [
                'charged_fees' => [],
                'pending_fees' => [],
                'invoices' => [],
            ];
        }

        // Get total credits
        $totalCredits = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('semester_id', $semesterId)
            ->whereHas('subject')
            ->with('subject')
            ->get()
            ->sum(fn($e) => $e->subject->credits ?? 0);

        // Already charged fee items
        $chargedItems = StudentInvoiceItem::whereHas('invoice', function ($q) use ($studentId, $semesterId) {
            $q->where('student_id', $studentId)
              ->where('semester_id', $semesterId)
              ->whereNotIn('status', ['cancelled']);
        })
        ->whereNotNull('fee_definition_id')
        ->with('feeDefinition')
        ->get();

        // Pending (not yet charged) fees
        $pendingFees = self::getNewFeesToCharge(
            $studentId,
            $semesterId,
            $registration->department_id,
            $registration->semester_number,
            $totalCredits,
            $student,
            $registration->study_year_id
        );

        // Invoices
        $invoices = StudentInvoice::where('student_id', $studentId)
            ->where('semester_id', $semesterId)
            ->with(['items.subject', 'items.feeDefinition'])
            ->get();

        return [
            'charged_fees' => $chargedItems,
            'pending_fees' => $pendingFees,
            'invoices' => $invoices,
            'total_credits' => $totalCredits,
        ];
    }
}
