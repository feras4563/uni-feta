<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Services\ClassSessionGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HolidayController extends Controller
{
    public function index()
    {
        return response()->json(
            Holiday::orderBy('start_date')->orderBy('end_date')->get()
        );
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_recurring' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $holiday = Holiday::create([
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_recurring' => $request->boolean('is_recurring'),
        ]);

        return response()->json($holiday, 201);
    }

    public function destroy($id)
    {
        $holiday = Holiday::findOrFail($id);
        $holiday->delete();

        return response()->json(['message' => 'Holiday deleted successfully']);
    }

    public function syncSchedule(Request $request, ClassSessionGenerationService $sessionGenerationService)
    {
        $validator = Validator::make($request->all(), [
            'semester_id' => 'required|exists:semesters,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $sessionGenerationService->syncForSemester($request->semester_id);

        return response()->json([
            'message' => 'Schedule synced successfully',
            'result' => $result,
        ]);
    }
}
