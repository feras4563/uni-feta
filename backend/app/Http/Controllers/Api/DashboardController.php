<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function stats()
    {
        // Count students
        $totalStudents = DB::table('students')->count();
        
        // Count teachers
        $totalTeachers = DB::table('teachers')->count();
        
        // Count departments
        $totalDepartments = DB::table('departments')->count();
        
        // Calculate pending fees (this is a placeholder - adjust based on your fee structure)
        $pendingFees = 0; // You can implement this based on your fee payment system
        
        return response()->json([
            'totalStudents' => $totalStudents,
            'totalTeachers' => $totalTeachers,
            'totalDepartments' => $totalDepartments,
            'pendingFees' => $pendingFees,
        ]);
    }
}
