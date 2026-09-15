<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    /**
     * Arabic status labels map.
     */
    protected array $statusLabels = [
        'pending'    => 'قيد الانتظار',
        'confirmed'  => 'تم التأكيد',
        'processing' => 'جاري التحضير',
        'shipped'    => 'تم الشحن',
        'delivered'  => 'تم التوصيل',
        'cancelled'  => 'ملغي',
    ];

    /**
     * Handle the Order "created" event.
     * Sends a push notification to all admins and sub-admins.
     */
    public function created(Order $order): void
    {
        try {
            $orderLabel = '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT);
            $customerName = $order->user ? $order->user->name : 'عميل';
            $totalAmount = number_format((float) $order->total_price, 2);

            $title = "طلب جديد {$orderLabel}";
            $body = "قام العميل {$customerName} بتقديم طلب جديد بقيمة {$totalAmount} ج.م";

            // Get all admins and sub_admins with valid fcm_tokens
            $adminTokens = User::whereIn('role', ['admin', 'sub_admin'])
                ->whereNotNull('fcm_token')
                ->where('fcm_token', '!=', '')
                ->pluck('fcm_token')
                ->toArray();

            $adminCount = User::whereIn('role', ['admin', 'sub_admin'])->count();
            Log::info("[OrderObserver] New order {$orderLabel}: Found {$adminCount} admin(s), " . count($adminTokens) . " with FCM tokens.");

            if (!empty($adminTokens)) {
                $sent = FcmService::sendToMultiple(
                    $adminTokens,
                    $title,
                    $body,
                    [
                        'type'     => 'new_order',
                        'order_id' => (string) $order->id,
                    ]
                );
                Log::info("[OrderObserver] Notification result for {$orderLabel}: {$sent}/" . count($adminTokens) . " succeeded.");
            } else {
                Log::warning("[OrderObserver] No admin FCM tokens found! Admin users need to login on the mobile app to receive push notifications.");
            }
        } catch (\Exception $e) {
            Log::error("OrderObserver created exception: " . $e->getMessage());
        }
    }

    /**
     * Handle the Order "updated" event.
     * Sends a push notification to the customer when the order status changes.
     */
    public function updated(Order $order): void
    {
        try {
            if ($order->wasChanged('status')) {
                $customer = $order->user;

                if ($customer && !empty($customer->fcm_token)) {
                    $orderLabel = '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT);
                    $newStatus = $order->status;
                    $statusArabic = $this->statusLabels[$newStatus] ?? $newStatus;

                    $title = "تحديث حالة الطلب {$orderLabel}";
                    $body = "تم تحديث حالة طلبك إلى: {$statusArabic}";

                    FcmService::sendNotification(
                        $customer->fcm_token,
                        $title,
                        $body,
                        [
                            'type'     => 'order_status_updated',
                            'order_id' => (string) $order->id,
                            'status'   => $newStatus,
                        ]
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error("OrderObserver updated exception: " . $e->getMessage());
        }
    }
}
