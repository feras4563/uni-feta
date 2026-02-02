<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TimeSlotController extends Controller
{
    /**
     * Get all time slots
     */
    public function index(Request $request)
    {
        $query = TimeSlot::query();

        // Filter by day of week if provided
        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === true);
        }

        // Order by start time
        $query->orderBy('start_time');

        $timeSlots = $query->get();

        return response()->json($timeSlots);
    }

    /**
     * Get a specific time slot
     */
    public function show($id)
    {
        $timeSlot = TimeSlot::find($id);

        if (!$timeSlot) {
            return response()->json([
                'message' => 'Time slot not found'
            ], 404);
        }

        return response()->json($timeSlot);
    }

    /**
     * Create a new time slot
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $timeSlot = TimeSlot::create($request->all());

        return response()->json($timeSlot, 201);
    }

    /**
     * Update a time slot
     */
    public function update(Request $request, $id)
    {
        $timeSlot = TimeSlot::find($id);

        if (!$timeSlot) {
            return response()->json([
                'message' => 'Time slot not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $timeSlot->update($request->all());

        return response()->json($timeSlot);
    }

    /**
     * Delete a time slot
     */
    public function destroy($id)
    {
        $timeSlot = TimeSlot::find($id);

        if (!$timeSlot) {
            return response()->json([
                'message' => 'Time slot not found'
            ], 404);
        }

        // Check if time slot is being used in timetable
        if ($timeSlot->timetableEntries()->exists()) {
            return response()->json([
                'message' => 'Cannot delete time slot as it is being used in timetable entries'
            ], 409);
        }

        $timeSlot->delete();

        return response()->json([
            'message' => 'Time slot deleted successfully'
        ]);
    }
}
