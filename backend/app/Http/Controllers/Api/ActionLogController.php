<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserActionLog;
use Illuminate\Http\Request;

class ActionLogController extends Controller
{
    /**
     * Get all action logs (manager only)
     */
    public function index(Request $request)
    {
        $query = UserActionLog::with('user:id,full_name,role,email')
            ->orderBy('created_at', 'desc');

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }

        // Filter by resource
        if ($request->has('resource') && $request->resource) {
            $query->where('resource', $request->resource);
        }

        // Filter by date range
        if ($request->has('from') && $request->from) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->has('to') && $request->to) {
            $query->where('created_at', '<=', $request->to . ' 23:59:59');
        }

        $perPage = $request->get('per_page', 50);
        $logs = $query->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get log statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => UserActionLog::count(),
            'today' => UserActionLog::whereDate('created_at', today())->count(),
            'by_action' => UserActionLog::selectRaw('action, count(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action'),
            'by_resource' => UserActionLog::selectRaw('resource, count(*) as count')
                ->groupBy('resource')
                ->pluck('count', 'resource'),
        ];

        return response()->json($stats);
    }
}
