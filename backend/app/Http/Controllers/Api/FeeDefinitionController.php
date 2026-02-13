<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeDefinition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeeDefinitionController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeDefinition::with(['rules.department', 'glAccount']);

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('frequency')) {
            $query->where('frequency', $request->frequency);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        $fee = FeeDefinition::with(['rules.department', 'glAccount'])->findOrFail($id);
        return response()->json($fee);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'default_amount' => 'required|numeric|min:0',
            'is_refundable' => 'boolean',
            'frequency' => 'required|in:one_time,per_semester,per_credit,annual',
            'is_active' => 'boolean',
            'description' => 'nullable|string',
            'gl_account_id' => 'nullable|exists:accounts,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $fee = FeeDefinition::create($request->all());
        $fee->load('glAccount');

        return response()->json($fee, 201);
    }

    public function update(Request $request, $id)
    {
        $fee = FeeDefinition::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'default_amount' => 'sometimes|numeric|min:0',
            'is_refundable' => 'boolean',
            'frequency' => 'sometimes|in:one_time,per_semester,per_credit,annual',
            'is_active' => 'boolean',
            'description' => 'nullable|string',
            'gl_account_id' => 'nullable|exists:accounts,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $fee->update($request->all());
        $fee->load('glAccount');

        return response()->json($fee);
    }

    public function destroy($id)
    {
        $fee = FeeDefinition::findOrFail($id);

        // Check if fee is used in any invoice items
        $usedCount = \App\Models\StudentInvoiceItem::where('fee_definition_id', $id)->count();
        if ($usedCount > 0) {
            return response()->json([
                'message' => 'لا يمكن حذف هذا الرسم لأنه مستخدم في ' . $usedCount . ' فاتورة',
            ], 422);
        }

        $fee->delete();

        return response()->json(['message' => 'Fee definition deleted successfully']);
    }
}
