<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['admin', 'sub_admin'])) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول لهذه الصفحة (للإدارة والمسؤولين فقط).',
                ], 403);
            }
            abort(403, 'غير مصرح لك بالوصول لهذه الصفحة (للإدارة والمسؤولين فقط).');
        }

        return $next($request);
    }
}
