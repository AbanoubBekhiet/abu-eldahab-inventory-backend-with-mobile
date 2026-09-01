<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class CheckFirstTimeRegistration
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $adminExists = User::where('role', 'admin')->exists();

        if (!$adminExists) {
            // Exclude the registration pages/actions from redirect loops
            if (!$request->is('auth/register') && !$request->is('auth/register/*')) {
                return redirect()->route('auth.register');
            }
        } else {
            // If admin exists, don't allow accessing the registration page
            if ($request->is('auth/register') || $request->is('auth/register/*')) {
                return redirect()->route('login');
            }
        }

        return $next($request);
    }
}
