<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    /**
     * Check whether a token looks like a valid push token.
     * Valid tokens are either:
     *  - Expo Push Tokens (ExponentPushToken[...] or ExpoPushToken[...])
     *  - Native FCM device tokens (typically 100+ chars, alphanumeric with colons/hyphens)
     *
     * Rejects fake/generated tokens like "fcm_1788965223974_abc123".
     */
    protected static function isValidPushToken(string $token): bool
    {
        // Expo Push Tokens
        if (str_starts_with($token, 'ExponentPushToken') || str_starts_with($token, 'ExpoPushToken')) {
            return true;
        }

        // Reject obvious fake tokens (old generated format: fcm_TIMESTAMP_RANDOM)
        if (str_starts_with($token, 'fcm_') || str_starts_with($token, 'fake_')) {
            return false;
        }

        // Native FCM tokens are typically 140+ characters long
        if (strlen($token) < 50) {
            return false;
        }

        return true;
    }

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
            Log::warning("[FcmService] Empty token, skipping notification: Title='{$title}'");
            return false;
        }

        if (!self::isValidPushToken($token)) {
            Log::warning("[FcmService] Invalid/fake push token rejected: '{$token}' — Title='{$title}'. User needs to re-login to get a real push token.");
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
            Log::warning("[FcmService] sendToMultiple called with no tokens — Title='{$title}'");
            return 0;
        }

        // Filter out invalid tokens upfront
        $validTokens = [];
        foreach ($tokens as $token) {
            if (self::isValidPushToken($token)) {
                $validTokens[] = $token;
            } else {
                Log::warning("[FcmService] Skipping invalid/fake token in batch: '{$token}'");
            }
        }

        if (empty($validTokens)) {
            $totalCount = count($tokens);
            Log::warning("[FcmService] All {$totalCount} tokens were invalid/fake. No notifications sent for: Title='{$title}'. Admin users need to re-login on the mobile app to get real push tokens.");
            return 0;
        }

        $successCount = 0;

        $expoTokens = [];
        $fcmTokens = [];

        foreach ($validTokens as $token) {
            if (str_starts_with($token, 'ExponentPushToken') || str_starts_with($token, 'ExpoPushToken')) {
                $expoTokens[] = $token;
            } else {
                $fcmTokens[] = $token;
            }
        }

        Log::info("[FcmService] Sending to " . count($expoTokens) . " Expo tokens + " . count($fcmTokens) . " FCM tokens — Title='{$title}'");

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
     * Validates the push ticket response to detect invalid tokens.
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
                // Expo returns HTTP 200 even for invalid tokens — check the ticket status
                $responseData = $response->json();
                $ticketData = $responseData['data'] ?? $responseData;

                if (isset($ticketData['status']) && $ticketData['status'] === 'error') {
                    $errorMessage = $ticketData['message'] ?? 'Unknown error';
                    $errorDetails = $ticketData['details']['error'] ?? '';
                    Log::error("[FcmService] Expo push ticket ERROR for token '{$token}': {$errorMessage} (detail: {$errorDetails})");

                    // Only clear token if the device is actually unregistered
                    // InvalidCredentials = project-level FCM key issue, don't clear the token
                    if ($errorDetails === 'DeviceNotRegistered') {
                        self::clearInvalidToken($token);
                    }
                    return false;
                }

                Log::info("[FcmService] ✅ Expo push notification delivered to {$token}");
                return true;
            }

            Log::error("[FcmService] Expo push HTTP error ({$response->status()}): " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("[FcmService] Expo push exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send batch notifications via Expo Push Notification API.
     * Validates each push ticket in the response.
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
                $responseData = $response->json();
                $tickets = $responseData['data'] ?? $responseData;

                if (!is_array($tickets)) {
                    Log::info("[FcmService] Batch Expo push sent to " . count($tokens) . " tokens (could not parse tickets).");
                    return count($tokens);
                }

                $successCount = 0;
                foreach ($tickets as $i => $ticket) {
                    $tokenForTicket = $tokens[$i] ?? 'unknown';
                    if (isset($ticket['status']) && $ticket['status'] === 'ok') {
                        $successCount++;
                    } else {
                        $errorMessage = $ticket['message'] ?? 'Unknown error';
                        $errorDetails = $ticket['details']['error'] ?? '';
                        Log::error("[FcmService] Expo batch ticket ERROR for token '{$tokenForTicket}': {$errorMessage} (detail: {$errorDetails})");

                        if ($errorDetails === 'DeviceNotRegistered') {
                            self::clearInvalidToken($tokenForTicket);
                        }
                    }
                }

                Log::info("[FcmService] Batch Expo push: {$successCount}/" . count($tokens) . " succeeded.");
                return $successCount;
            }

            Log::error("[FcmService] Batch Expo push HTTP error ({$response->status()}): " . $response->body());
            return 0;
        } catch (\Exception $e) {
            Log::error("[FcmService] Batch Expo push exception: " . $e->getMessage());
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
                // No FCM_SERVER_KEY configured — try Expo Push as fallback for Expo tokens
                // For native FCM tokens without a server key, we can only log
                Log::warning("[FcmService] No FCM_SERVER_KEY configured. Cannot send FCM notification to native token: " . substr($token, 0, 30) . "... — Title='{$title}'");
                return false;
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
                $responseData = $response->json();
                if (isset($responseData['failure']) && $responseData['failure'] > 0) {
                    Log::error("[FcmService] FCM reported failure for token '{$token}': " . $response->body());
                    return false;
                }
                Log::info("[FcmService] ✅ FCM notification sent to " . substr($token, 0, 30) . "...");
                return true;
            }

            Log::error("[FcmService] FCM HTTP error ({$response->status()}): " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("[FcmService] FCM exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Clear an invalid push token from all user records that have it.
     * This prevents repeated failed sends to the same bad token.
     */
    protected static function clearInvalidToken(string $token): void
    {
        try {
            $cleared = \App\Models\User::where('fcm_token', $token)->update(['fcm_token' => null]);
            if ($cleared > 0) {
                Log::info("[FcmService] Cleared invalid token from {$cleared} user(s): '{$token}'");
            }
        } catch (\Exception $e) {
            Log::error("[FcmService] Failed to clear invalid token: " . $e->getMessage());
        }
    }
}
