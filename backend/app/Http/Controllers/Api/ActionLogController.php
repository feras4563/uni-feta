<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserActionLog;
use App\Models\AppUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActionLogController extends Controller
{
    /**
     * Get all action logs (manager only) with advanced filtering
     */
    public function index(Request $request)
    {
        $query = UserActionLog::with('user:id,full_name,role,email')
            ->orderBy('created_at', 'desc');

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Filter by resource
        if ($request->filled('resource')) {
            $query->where('resource', $request->resource);
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->from . ' 00:00:00');
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->to . ' 23:59:59');
        }

        // Full-text search across details, resource_id, ip_address
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('resource_id', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('full_name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->get('per_page', 30);
        $logs = $query->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get log statistics with time-series data
     */
    public function statistics(Request $request)
    {
        $totalQuery = UserActionLog::query();
        $todayQuery = UserActionLog::whereDate('created_at', today());
        $weekQuery = UserActionLog::where('created_at', '>=', now()->subDays(7));

        // Apply same filters to stats if provided
        foreach ([$totalQuery, $todayQuery, $weekQuery] as $q) {
            if ($request->filled('user_id')) $q->where('user_id', $request->user_id);
            if ($request->filled('resource')) $q->where('resource', $request->resource);
        }

        // Actions breakdown
        $byAction = UserActionLog::selectRaw('action, count(*) as count')
            ->groupBy('action')
            ->orderByDesc('count')
            ->pluck('count', 'action');

        // Resources breakdown
        $byResource = UserActionLog::selectRaw('resource, count(*) as count')
            ->groupBy('resource')
            ->orderByDesc('count')
            ->pluck('count', 'resource');

        // Daily activity for last 14 days
        $dailyActivity = UserActionLog::selectRaw("DATE(created_at) as date, count(*) as count")
            ->where('created_at', '>=', now()->subDays(14))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date');

        // Top active users (last 30 days)
        $topUsers = UserActionLog::select('user_id', DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('user_id')
            ->orderByDesc('count')
            ->limit(10)
            ->with('user:id,full_name,role')
            ->get()
            ->map(fn($item) => [
                'user_id' => $item->user_id,
                'user_name' => $item->user?->full_name ?? 'غير معروف',
                'user_role' => $item->user?->role ?? 'unknown',
                'count' => $item->count,
            ]);

        // Hourly distribution (for heatmap)
        $hourlyDistribution = UserActionLog::selectRaw("HOUR(created_at) as hour, count(*) as count")
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->orderBy('hour')
            ->pluck('count', 'hour');

        $stats = [
            'total' => $totalQuery->count(),
            'today' => $todayQuery->count(),
            'this_week' => $weekQuery->count(),
            'by_action' => $byAction,
            'by_resource' => $byResource,
            'daily_activity' => $dailyActivity,
            'top_users' => $topUsers,
            'hourly_distribution' => $hourlyDistribution,
        ];

        return response()->json($stats);
    }

    /**
     * Get distinct filter options (users, actions, resources)
     */
    public function filters()
    {
        $actions = UserActionLog::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        $resources = UserActionLog::select('resource')
            ->distinct()
            ->orderBy('resource')
            ->pluck('resource');

        $users = AppUser::select('id', 'full_name', 'role')
            ->whereIn('id', UserActionLog::select('user_id')->distinct())
            ->orderBy('full_name')
            ->get();

        return response()->json([
            'actions' => $actions,
            'resources' => $resources,
            'users' => $users,
        ]);
    }

    /**
     * Get a single log entry with full details
     */
    public function show(string $id)
    {
        $log = UserActionLog::with('user:id,full_name,role,email')
            ->findOrFail($id);

        return response()->json($log);
    }

    /**
     * Export logs as CSV
     */
    public function export(Request $request)
    {
        $query = UserActionLog::with('user:id,full_name,role,email')
            ->orderBy('created_at', 'desc');

        if ($request->filled('user_id')) $query->where('user_id', $request->user_id);
        if ($request->filled('action')) $query->where('action', $request->action);
        if ($request->filled('resource')) $query->where('resource', $request->resource);
        if ($request->filled('from')) $query->where('created_at', '>=', $request->from . ' 00:00:00');
        if ($request->filled('to')) $query->where('created_at', '<=', $request->to . ' 23:59:59');

        $logs = $query->limit(5000)->get();

        $csv = "التاريخ,المستخدم,الدور,العملية,المورد,معرف المورد,IP\n";
        foreach ($logs as $log) {
            $csv .= implode(',', [
                $log->created_at,
                '"' . ($log->user?->full_name ?? '-') . '"',
                $log->user?->role ?? '-',
                $log->action,
                $log->resource,
                $log->resource_id ?? '-',
                $log->ip_address ?? '-',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="action-logs-' . now()->format('Y-m-d') . '.csv"',
        ]);
    }
}
