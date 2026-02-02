<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudyYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudyYearController extends Controller
{
    public function index()
    {
        $studyYears = StudyYear::orderBy('start_date', 'desc')->get();
        return response()->json($studyYears);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:study_years,name',
            'name_en' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $studyYear = StudyYear::create($request->all());
        return response()->json($studyYear, 201);
    }

    public function show($id)
    {
        $studyYear = StudyYear::with('semesters')->findOrFail($id);
        return response()->json($studyYear);
    }

    public function update(Request $request, $id)
    {
        $studyYear = StudyYear::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|unique:study_years,name,' . $id,
            'name_en' => 'nullable|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'is_current' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $studyYear->update($request->all());
        return response()->json($studyYear);
    }

    public function destroy($id)
    {
        $studyYear = StudyYear::findOrFail($id);
        $studyYear->delete();
        return response()->json(['message' => 'Study year deleted successfully'], 200);
    }

    public function current()
    {
        $current = StudyYear::where('is_current', true)->first();
        return response()->json($current);
    }

    public function setCurrent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year_id' => 'required|exists:study_years,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Set all study years to not current
        StudyYear::query()->update(['is_current' => false]);

        // Set the specified study year as current
        $studyYear = StudyYear::findOrFail($request->year_id);
        $studyYear->update(['is_current' => true]);

        return response()->json([
            'message' => 'Current study year updated successfully',
            'study_year' => $studyYear
        ]);
    }
}
