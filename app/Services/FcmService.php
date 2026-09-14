<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    /**
     * Send push notification to a single FCM or Expo push token.
     *
     * @param string $token Target device token
     * @param string $title Notification title
     * @param string $body Notification message body
     * @param array $data Additional payload data
     * @return bool Success status
     */
    public static function sendNotification(string $token, string $title, string $body, array $data = []): bool
    {
        if (empty($token)) {
            return false;
        }

        // Check if token is an Expo Push Token
        if (str_starts_with($token, 'ExponentPushToken') || str_starts_with($token, 'ExpoPushToken')) {
            return self::sendViaExpoPush($token, $title, $body, $data);
        }

        // Otherwise send via Firebase FCM
        return self::sendViaFcm($token, $title, $body, $data);
    }

    /**
     * Send push notification to multiple tokens.
     *
     * @param array $tokens List of push tokens
     * @param string $title Notification title
     * @param string $body Notification message body
     * @param array $data Additional payload data
     * @return int Count of successful sends
     */
    public static function sendToMultiple(array $tokens, string $title, string $body, array $data = []): int
    {
        $tokens = array_filter(array_unique($tokens));
        if (empty($tokens)) {
            return 0;
        }

        $successCount = 0;

        $expoTokens = [];
        $fcmTokens = [];

        foreach ($tokens as $token) {
            if (str_starts_with($token, 'ExponentPushToken') || str_starts_with($token, 'ExpoPushToken')) {
                $expoTokens[] = $token;
            } else {
                $fcmTokens[] = $token;
            }
        }

        if (!empty($expoTokens)) {
            $successCount += self::sendBatchExpoPush($expoTokens, $title, $body, $data);
        }

        foreach ($fcmTokens as $token) {
            if (self::sendViaFcm($token, $title, $body, $data)) {
                $successCount++;
            }
        }

        return $successCount;
    }

    /**
     * Send notification via Expo Push Notification API.
     */
    protected static function sendViaExpoPush(string $token, string $title, string $body, array $data = []): bool
    {
        try {
            $response = Http::withHeaders([
                'Accept'       => 'application/json',
                'Content-Type' => 'application/json',
            ])->post('https://exp.host/--/api/v2/push/send', [
                'to'    => $token,
                'title' => $title,
                'body'  => $body,
                'data'  => $data,
                'sound' => 'default',
                'priority' => 'high',
            ]);

            if ($response->successful()) {
                Log::info("Expo push notification sent successfully to {$token}");
                return true;
            }

            Log::error("Expo push notification failed: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("Expo push notification exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send batch notifications via Expo Push Notification API.
     */
    protected static function sendBatchExpoPush(array $tokens, string $title, string $body, array $data = []): int
    {
        try {
            $messages = array_map(function ($token) use ($title, $body, $data) {
                return [
                    'to'       => $token,
                    'title'    => $title,
                    'body'     => $body,
                    'data'     => $data,
                    'sound'    => 'default',
                    'priority' => 'high',
                ];
            }, $tokens);

            $response = Http::withHeaders([
                'Accept'       => 'application/json',
                'Content-Type' => 'application/json',
            ])->post('https://exp.host/--/api/v2/push/send', $messages);

            if ($response->successful()) {
                Log::info("Batch Expo push notifications sent to " . count($tokens) . " tokens.");
                return count($tokens);
            }

            Log::error("Batch Expo push notifications failed: " . $response->body());
            return 0;
        } catch (\Exception $e) {
            Log::error("Batch Expo push notification exception: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Send notification via Firebase FCM REST API.
     */
    protected static function sendViaFcm(string $token, string $title, string $body, array $data = []): bool
    {
        try {
            $serverKey = env('FCM_SERVER_KEY');

            if (!$serverKey) {
                // If FCM_SERVER_KEY is not configured, fall back to Expo Push endpoint
                // or log info if token was generated in fallback format
                Log::info("FCM Notification Log: Title='{$title}', Body='{$body}', Token='{$token}'");
                return self::sendViaExpoPush($token, $title, $body, $data);
            }

            $response = Http::withHeaders([
                'Authorization' => 'key=' . $serverKey,
                'Content-Type'  => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', [
                'to'           => $token,
                'notification' => [
                    'title' => $title,
                    'body'  => $body,
                    'sound' => 'default',
                ],
                'data'         => $data,
                'priority'     => 'high',
            ]);

            if ($response->successful()) {
                Log::info("FCM notification sent successfully to {$token}");
                return true;
            }

            Log::error("FCM notification failed: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("FCM notification exception: " . $e->getMessage());
            return false;
        }
    }
}
