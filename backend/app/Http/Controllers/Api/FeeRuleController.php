<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeRule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeeRuleController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeRule::with(['feeDefinition', 'department']);

        if ($request->has('fee_definition_id')) {
            $query->where('fee_definition_id', $request->fee_definition_id);
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        $rule = FeeRule::with(['feeDefinition', 'department'])->findOrFail($id);
        return response()->json($rule);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fee_definition_id' => 'required|exists:fee_definitions,id',
            'department_id' => 'nullable|exists:departments,id',
            'target_semester' => 'nullable|integer|min:1',
            'override_amount' => 'nullable|numeric|min:0',
            'condition_type' => 'nullable|string|in:total_credits_gt,total_credits_lt,student_year_eq,nationality_eq,none',
            'condition_value' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $rule = FeeRule::create($request->all());
        $rule->load(['feeDefinition', 'department']);

        return response()->json($rule, 201);
    }

    public function update(Request $request, $id)
    {
        $rule = FeeRule::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'fee_definition_id' => 'sometimes|exists:fee_definitions,id',
            'department_id' => 'nullable|exists:departments,id',
            'target_semester' => 'nullable|integer|min:1',
            'override_amount' => 'nullable|numeric|min:0',
            'condition_type' => 'nullable|string|in:total_credits_gt,total_credits_lt,student_year_eq,nationality_eq,none',
            'condition_value' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $rule->update($request->all());
        $rule->load(['feeDefinition', 'department']);

        return response()->json($rule);
    }

    public function destroy($id)
    {
        $rule = FeeRule::findOrFail($id);
        $rule->delete();

        return response()->json(['message' => 'Fee rule deleted successfully']);
    }

    /**
     * Get applicable fees for a student based on department and semester
     */
    public function getApplicableFees(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,id',
            'semester_number' => 'required|integer|min:1',
            'total_credits' => 'nullable|integer|min:0',
            'student_year' => 'nullable|integer|min:1',
            'nationality' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $departmentId = $request->department_id;
        $semesterNumber = $request->semester_number;

        // Get all active fee definitions with their active rules
        $feeDefinitions = \App\Models\FeeDefinition::where('is_active', true)
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
                    'fee_definition' => $feeDef,
                    'amount' => $feeDef->default_amount,
                    'rule_id' => null,
                    'matched_rule' => null,
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
                            if (!$request->total_credits || $request->total_credits <= (int)$rule->condition_value) {
                                $matches = false;
                            }
                            break;
                        case 'total_credits_lt':
                            if (!$request->total_credits || $request->total_credits >= (int)$rule->condition_value) {
                                $matches = false;
                            }
                            break;
                        case 'student_year_eq':
                            if (!$request->student_year || $request->student_year != (int)$rule->condition_value) {
                                $matches = false;
                            }
                            break;
                        case 'nationality_eq':
                            if (!$request->nationality || strtolower($request->nationality) !== strtolower($rule->condition_value)) {
                                $matches = false;
                            }
                            break;
                    }
                }

                if ($matches) {
                    $applicableFees[] = [
                        'fee_definition' => $feeDef,
                        'amount' => $rule->override_amount ?? $feeDef->default_amount,
                        'rule_id' => $rule->id,
                        'matched_rule' => $rule,
                    ];
                    break; // First matching rule wins for this fee definition
                }
            }
        }

        return response()->json($applicableFees);
    }
}
