<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountDefault;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccountDefaultController extends Controller
{
    /**
     * Get all account defaults
     */
    public function index()
    {
        $defaults = AccountDefault::with('account')->get();
        return response()->json($defaults);
    }

    /**
     * Save or update account defaults
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'defaults' => 'required|array',
            'defaults.*.category' => 'required|string',
            'defaults.*.account_id' => 'nullable|exists:accounts,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $defaults = $request->input('defaults');

        foreach ($defaults as $default) {
            AccountDefault::updateOrCreate(
                ['category' => $default['category']],
                [
                    'account_id' => $default['account_id'],
                    'description' => $default['description'] ?? null,
                ]
            );
        }

        return response()->json([
            'message' => 'Account defaults saved successfully',
            'defaults' => AccountDefault::with('account')->get()
        ]);
    }

    /**
     * Get account default by category
     */
    public function getByCategory($category)
    {
        $default = AccountDefault::with('account')
            ->where('category', $category)
            ->first();

        if (!$default) {
            return response()->json([
                'message' => 'Default not found'
            ], 404);
        }

        return response()->json($default);
    }

    /**
     * Delete account default
     */
    public function destroy($id)
    {
        $default = AccountDefault::find($id);

        if (!$default) {
            return response()->json([
                'message' => 'Default not found'
            ], 404);
        }

        $default->delete();

        return response()->json([
            'message' => 'Account default deleted successfully'
        ]);
    }
}
