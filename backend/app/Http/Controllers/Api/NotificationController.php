<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $userId = auth()->id();
        $query = Notification::where('user_id', $userId)->orderBy('created_at', 'desc');

        if ($request->has('is_read')) {
            $query->where('is_read', $request->boolean('is_read'));
        }

        $limit = $request->input('limit', 50);
        $notifications = $query->take($limit)->get();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => NotificationService::unreadCount($userId),
        ]);
    }

    public function unreadCount()
    {
        return response()->json([
            'unread_count' => NotificationService::unreadCount(auth()->id()),
        ]);
    }

    public function markAsRead(Request $request)
    {
        $request->validate([
            'notification_ids' => 'required|array|min:1',
            'notification_ids.*' => 'required|string',
        ]);

        $updated = NotificationService::markAsRead($request->notification_ids, auth()->id());

        return response()->json([
            'message' => 'تم تحديث الإشعارات',
            'updated' => $updated,
            'unread_count' => NotificationService::unreadCount(auth()->id()),
        ]);
    }

    public function markAllAsRead()
    {
        $updated = NotificationService::markAllAsRead(auth()->id());

        return response()->json([
            'message' => 'تم قراءة جميع الإشعارات',
            'updated' => $updated,
            'unread_count' => 0,
        ]);
    }
}
