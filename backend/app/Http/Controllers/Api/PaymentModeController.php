<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentModeController extends Controller
{
    /**
     * Get all payment modes
     */
    public function index()
    {
        $paymentModes = PaymentMode::with('account')
            ->orderBy('name')
            ->get();

        return response()->json($paymentModes);
    }

    /**
     * Get a single payment mode
     */
    public function show($id)
    {
        $paymentMode = PaymentMode::with('account')->findOrFail($id);
        return response()->json($paymentMode);
    }

    /**
     * Create a new payment mode
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'account_id' => 'required|exists:accounts,id',
            'type' => 'required|in:cash,bank,card,check,other',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $paymentMode = PaymentMode::create($request->all());
        $paymentMode->load('account');

        return response()->json($paymentMode, 201);
    }

    /**
     * Update a payment mode
     */
    public function update(Request $request, $id)
    {
        $paymentMode = PaymentMode::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'account_id' => 'sometimes|required|exists:accounts,id',
            'type' => 'sometimes|required|in:cash,bank,card,check,other',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $paymentMode->update($request->all());
        $paymentMode->load('account');

        return response()->json($paymentMode);
    }

    /**
     * Delete a payment mode
     */
    public function destroy($id)
    {
        $paymentMode = PaymentMode::findOrFail($id);
        
        // Check if payment mode has any payment entries
        if ($paymentMode->paymentEntries()->count() > 0) {
            return response()->json([
                'message' => 'لا يمكن حذف طريقة الدفع لأنها مرتبطة بقيود دفع'
            ], 422);
        }

        $paymentMode->delete();

        return response()->json([
            'message' => 'تم حذف طريقة الدفع بنجاح'
        ]);
    }
}
