<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\AppUser;

class NotificationService
{
    /**
     * Send a notification to a specific user.
     */
    public static function notify(
        ?int $userId,
        string $type,
        string $title,
        ?string $body = null,
        ?string $icon = null,
        ?string $link = null,
        ?array $data = null
    ): ?Notification {
        if (!$userId) return null;

        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'icon' => $icon,
            'link' => $link,
            'data' => $data,
        ]);
    }

    /**
     * Send a notification to multiple users.
     */
    public static function notifyMany(
        array $userIds,
        string $type,
        string $title,
        ?string $body = null,
        ?string $icon = null,
        ?string $link = null,
        ?array $data = null
    ): int {
        $count = 0;
        foreach ($userIds as $userId) {
            if ($userId && self::notify($userId, $type, $title, $body, $icon, $link, $data)) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * Send notification to all users with a specific role.
     */
    public static function notifyRole(
        string $role,
        string $type,
        string $title,
        ?string $body = null,
        ?string $icon = null,
        ?string $link = null,
        ?array $data = null
    ): int {
        $userIds = AppUser::where('role', $role)
            ->whereNotNull('auth_user_id')
            ->pluck('auth_user_id')
            ->toArray();

        return self::notifyMany($userIds, $type, $title, $body, $icon, $link, $data);
    }

    /**
     * Notify a student by student_id (resolves auth_user_id).
     */
    public static function notifyStudent(
        string $studentId,
        string $type,
        string $title,
        ?string $body = null,
        ?string $icon = null,
        ?string $link = null,
        ?array $data = null
    ): ?Notification {
        $userId = \App\Models\Student::where('id', $studentId)->value('auth_user_id');
        return self::notify($userId ? (int) $userId : null, $type, $title, $body, $icon, $link, $data);
    }

    /**
     * Get unread count for a user.
     */
    public static function unreadCount(int $userId): int
    {
        return Notification::where('user_id', $userId)->where('is_read', false)->count();
    }

    /**
     * Mark notifications as read.
     */
    public static function markAsRead(array $notificationIds, int $userId): int
    {
        return Notification::whereIn('id', $notificationIds)
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
    }

    /**
     * Mark all notifications as read for a user.
     */
    public static function markAllAsRead(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
    }
}
