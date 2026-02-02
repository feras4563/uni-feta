<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoomController extends Controller
{
    /**
     * Get all rooms
     */
    public function index(Request $request)
    {
        $query = Room::query();
        
        // Check if pagination is disabled
        $paginate = $request->query('paginate', 'true');
        
        if ($paginate === 'false') {
            $rooms = $query->get();
            return response()->json($rooms);
        }
        
        // Default pagination
        $perPage = $request->query('per_page', 15);
        $rooms = $query->paginate($perPage);
        
        return response()->json($rooms);
    }
    
    /**
     * Create a new room
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'room_number' => 'required|string|max:255|unique:rooms,room_number',
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'room_type' => 'required|in:lecture,lab,seminar,conference',
            'capacity' => 'required|integer|min:1',
            'floor' => 'nullable|integer',
            'building' => 'nullable|string|max:255',
            'equipment' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $room = Room::create($request->all());
        
        return response()->json($room, 201);
    }
    
    /**
     * Get a specific room
     */
    public function show($id)
    {
        $room = Room::find($id);
        
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }
        
        return response()->json($room);
    }
    
    /**
     * Update a room
     */
    public function update(Request $request, $id)
    {
        $room = Room::find($id);
        
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'room_number' => 'sometimes|required|string|max:255|unique:rooms,room_number,' . $id,
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'room_type' => 'sometimes|required|in:lecture,lab,seminar,conference',
            'capacity' => 'sometimes|required|integer|min:1',
            'floor' => 'nullable|integer',
            'building' => 'nullable|string|max:255',
            'equipment' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $room->update($request->all());
        
        return response()->json($room);
    }
    
    /**
     * Delete a room
     */
    public function destroy($id)
    {
        $room = Room::find($id);
        
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }
        
        $room->delete();
        
        return response()->json(['message' => 'Room deleted successfully']);
    }
}
