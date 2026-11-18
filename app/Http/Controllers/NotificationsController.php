<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationRead;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationsController extends Controller
{
    /**
     * Admin sends a notification (broadcast or to specific user).
     * POST /api/notifications
     */
    public function apiStore(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:2000',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $admin = $request->user();

        $notification = Notification::create([
            'title' => $request->title,
            'body' => $request->body,
            'type' => 'custom',
            'user_id' => $request->user_id,
            'sent_by' => $admin->id,
            'data' => [
                'type' => 'custom_notification',
                'notification_id' => null, // will be updated after create
            ],
        ]);

        // Update data with the notification ID
        $notification->update([
            'data' => [
                'type' => 'custom_notification',
                'notification_id' => (string) $notification->id,
            ],
        ]);

        // Send push notification
        try {
            if ($request->user_id) {
                // Send to specific user
                $targetUser = User::find($request->user_id);
                if ($targetUser && $targetUser->fcm_token) {
                    FcmService::sendNotification(
                        $targetUser->fcm_token,
                        $request->title,
                        $request->body,
                        [
                            'type' => 'custom_notification',
                            'notification_id' => (string) $notification->id,
                        ]
                    );
                }
            } else {
                // Broadcast to all customers
                $tokens = User::where('role', 'customer')
                    ->whereNotNull('fcm_token')
                    ->where('fcm_token', '!=', '')
                    ->pluck('fcm_token')
                    ->toArray();

                if (!empty($tokens)) {
                    FcmService::sendToMultiple(
                        $tokens,
                        $request->title,
                        $request->body,
                        [
                            'type' => 'custom_notification',
                            'notification_id' => (string) $notification->id,
                        ]
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to send push notification: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => $request->user_id
                ? 'تم إرسال الإشعار للمستخدم بنجاح'
                : 'تم إرسال الإشعار لجميع المستخدمين بنجاح',
            'notification' => $notification,
        ], 201);
    }

    /**
     * List notifications for the current user (broadcasts + targeted).
     * GET /api/notifications
     */
    public function apiIndex(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::where(function ($query) use ($user) {
                $query->whereNull('user_id') // broadcasts
                      ->orWhere('user_id', $user->id); // targeted
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Get read notification IDs for this user
        $readIds = NotificationRead::where('user_id', $user->id)
            ->pluck('notification_id')
            ->toArray();

        $items = $notifications->getCollection()->map(function ($n) use ($readIds) {
            return [
                'id' => $n->id,
                'title' => $n->title,
                'body' => $n->body,
                'type' => $n->type,
                'data' => $n->data,
                'is_read' => in_array($n->id, $readIds),
                'created_at' => $n->created_at->toISOString(),
            ];
        });

        return response()->json([
            'notifications' => [
                'data' => $items,
                'next_page' => $notifications->hasMorePages()
                    ? $notifications->currentPage() + 1
                    : null,
            ],
        ]);
    }

    /**
     * Mark a notification as read for the current user.
     * POST /api/notifications/{id}/read
     */
    public function apiMarkAsRead(Request $request, $id)
    {
        $user = $request->user();
        $notification = Notification::findOrFail($id);

        // Ensure user can access this notification
        if ($notification->user_id !== null && $notification->user_id !== $user->id) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        NotificationRead::firstOrCreate([
            'notification_id' => $notification->id,
            'user_id' => $user->id,
        ], [
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديد الإشعار كمقروء',
        ]);
    }

    /**
     * Mark all notifications as read for the current user.
     * POST /api/notifications/read-all
     */
    public function apiMarkAllAsRead(Request $request)
    {
        $user = $request->user();

        // Get all unread notification IDs for this user
        $notificationIds = Notification::where(function ($query) use ($user) {
                $query->whereNull('user_id')
                      ->orWhere('user_id', $user->id);
            })
            ->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->pluck('id');

        $records = $notificationIds->map(function ($nid) use ($user) {
            return [
                'notification_id' => $nid,
                'user_id' => $user->id,
                'read_at' => now(),
            ];
        })->toArray();

        if (!empty($records)) {
            NotificationRead::insert($records);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديد جميع الإشعارات كمقروءة',
        ]);
    }

    /**
     * Get unread notifications count for the current user.
     * GET /api/notifications/unread-count
     */
    public function apiUnreadCount(Request $request)
    {
        $user = $request->user();

        $count = Notification::where(function ($query) use ($user) {
                $query->whereNull('user_id')
                      ->orWhere('user_id', $user->id);
            })
            ->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->count();

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    /**
     * Admin: list all sent notifications (for admin panel).
     * GET /api/notifications/sent
     */
    public function apiSentIndex(Request $request)
    {
        $notifications = Notification::with('sender:id,name', 'targetUser:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $items = $notifications->getCollection()->map(function ($n) {
            return [
                'id' => $n->id,
                'title' => $n->title,
                'body' => $n->body,
                'type' => $n->type,
                'user_id' => $n->user_id,
                'target_user_name' => $n->targetUser?->name ?? 'جميع المستخدمين',
                'sent_by_name' => $n->sender?->name ?? '—',
                'created_at' => $n->created_at->toISOString(),
            ];
        });

        return response()->json([
            'notifications' => [
                'data' => $items,
                'next_page' => $notifications->hasMorePages()
                    ? $notifications->currentPage() + 1
                    : null,
            ],
        ]);
    }

    /**
     * Admin: search users for notification target.
     * GET /api/notifications/search-users
     */
    public function apiSearchUsers(Request $request)
    {
        $search = trim($request->query('search', ''));

        $query = User::with('profile');

        if (!empty($search)) {
            $searchNorm = preg_replace('/[أإآا]/u', '_', $search);
            $searchNorm = preg_replace('/[ةه]/u', '_', $searchNorm);
            $searchNorm = preg_replace('/[يى]/u', '_', $searchNorm);

            $query->where(function ($q) use ($search, $searchNorm) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$searchNorm}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('profile', function ($pq) use ($search, $searchNorm) {
                      $pq->where('phone_number', 'like', "%{$search}%")
                         ->orWhere('shop_name', 'like', "%{$search}%")
                         ->orWhere('shop_name', 'like', "%{$searchNorm}%")
                         ->orWhere('address', 'like', "%{$search}%")
                         ->orWhere('address', 'like', "%{$searchNorm}%");
                  });
            });
        }

        $users = $query->orderByRaw("CASE WHEN role = 'customer' THEN 0 ELSE 1 END")
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function ($u) {
                $cleanEmail = ($u->email && !str_ends_with($u->email, '@pos.local')) ? $u->email : '';
                $phone = $u->profile?->phone_number ?? '';
                if ($phone === '—') $phone = '';
                $shopName = $u->profile?->shop_name ?? '';
                if ($shopName === '—') $shopName = '';

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $cleanEmail,
                    'phone' => $phone,
                    'shop_name' => $shopName,
                    'role' => $u->role ?? 'customer',
                ];
            });

        return response()->json(['users' => $users]);
    }
}
