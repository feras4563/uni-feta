<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubjectTitle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubjectTitleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SubjectTitle::with('subject');

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        $titles = $query->orderBy('order_index')->get();

        return response()->json($titles);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $title = SubjectTitle::create($request->all());
        $title->load('subject');

        return response()->json($title, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $title = SubjectTitle::with('subject')->findOrFail($id);
        return response()->json($title);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $title = SubjectTitle::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'subject_id' => 'sometimes|required|exists:subjects,id',
            'title' => 'sometimes|required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $title->update($request->all());
        $title->load('subject');

        return response()->json($title);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $title = SubjectTitle::findOrFail($id);
        $title->delete();

        return response()->json(['message' => 'Subject title deleted successfully'], 200);
    }
}
