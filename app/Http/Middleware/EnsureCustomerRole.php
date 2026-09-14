<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && in_array($user->role, ['admin', 'sub_admin'])) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح للآدمن بالوصول لصفحات العملاء.',
                ], 403);
            }
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
