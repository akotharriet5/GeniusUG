<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

// Assumes users.role = 'admin' | 'parent' | 'pupil'.
// Register in bootstrap/app.php:  $middleware->alias(['admin' => \App\Http\Middleware\EnsureAdmin::class]);
class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json(['message' => 'Admins only.'], 403);
        }
        return $next($request);
    }
}
