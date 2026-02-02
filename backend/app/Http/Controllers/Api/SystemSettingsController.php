<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SystemSettingsController extends Controller
{
    /**
     * Get system settings
     */
    public function index()
    {
        try {
            $settings = SystemSettings::first();
            
            if (!$settings) {
                // Return default settings if none exist
                return response()->json([
                    'id' => 1,
                    'app_name' => 'UniERP Horizon',
                    'app_logo_url' => null,
                    'app_logo_name' => null,
                    'theme_color' => '#059669',
                    'language' => 'ar',
                    'timezone' => 'Asia/Riyadh',
                ]);
            }
            
            return response()->json($settings);
        } catch (\Exception $e) {
            \Log::error('System settings error: ' . $e->getMessage());
            
            // Return default settings on error
            return response()->json([
                'id' => 1,
                'app_name' => 'UniERP Horizon',
                'app_logo_url' => null,
                'app_logo_name' => null,
                'theme_color' => '#059669',
                'language' => 'ar',
                'timezone' => 'Asia/Riyadh',
            ]);
        }
    }

    /**
     * Update system settings
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'nullable|string|max:255',
            'theme_color' => 'nullable|string|max:7',
            'language' => 'nullable|string|in:ar,en',
            'timezone' => 'nullable|string',
        ]);

        $settings = SystemSettings::firstOrCreate(
            ['id' => 1],
            [
                'app_name' => env('APP_NAME', 'UniERP Horizon'),
                'theme_color' => '#059669',
                'language' => 'ar',
                'timezone' => env('APP_TIMEZONE', 'Asia/Riyadh'),
            ]
        );

        $settings->update($validated);
        
        Cache::forget('system_settings');

        return response()->json($settings);
    }

    /**
     * Upload app logo
     */
    public function uploadLogo(Request $request)
    {
        try {
            $request->validate([
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:5120', // 5MB max
            ]);

            $settings = SystemSettings::firstOrCreate(
                ['id' => 1],
                [
                    'app_name' => env('APP_NAME', 'UniERP Horizon'),
                    'theme_color' => '#059669',
                    'language' => 'ar',
                    'timezone' => env('APP_TIMEZONE', 'Asia/Riyadh'),
                ]
            );

            // Delete old logo if exists
            if ($settings->app_logo_name && Storage::disk('public')->exists('logos/' . $settings->app_logo_name)) {
                Storage::disk('public')->delete('logos/' . $settings->app_logo_name);
            }

            // Store new logo
            $file = $request->file('logo');
            $fileName = 'app-logo-' . time() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('logos', $fileName, 'public');

            // Generate URL - use url() instead of asset() for better compatibility
            $logoUrl = url('storage/logos/' . $fileName);

            // Update settings
            $settings->update([
                'app_logo_url' => $logoUrl,
                'app_logo_name' => $fileName,
            ]);

            Cache::forget('system_settings');

            return response()->json([
                'message' => 'تم رفع الشعار بنجاح',
                'settings' => $settings,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Logo upload validation error: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'خطأ في التحقق من الملف',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Logo upload error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'خطأ في رفع الشعار',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
