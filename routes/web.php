<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SettingsController;

/*
|--------------------------------------------------------------------------
| Web Routes (Inertia SPA Page Shells)
|--------------------------------------------------------------------------
| All data, state, authentication, and mutations are handled asynchronously
| by Laravel Sanctum REST API endpoints in routes/api.php.
*/

// Auth Pages
Route::get('/login', fn () => Inertia::render('auth/login'))->name('login');
Route::prefix('auth')->group(function () {
    Route::get('/login', fn () => Inertia::render('auth/login'))->name('auth.login');
    Route::get('/register', fn () => Inertia::render('auth/register'))->name('auth.register');
    Route::get('/reset-password', fn () => Inertia::render('auth/reset_password'))->name('reset-password');
    Route::get('/verify-reset-code', fn () => Inertia::render('auth/verify_reset_code'))->name('verify-reset-code');
});

// App Feature Pages
Route::get('/', fn () => Inertia::render('dashboard/Index'))->name('dashboard');
Route::get('/pos', fn () => Inertia::render('pos/Index'))->name('pos');
Route::get('/products', fn () => Inertia::render('products/Index'))->name('products');
Route::get('/orders', fn () => Inertia::render('orders/Index'))->name('orders');

Route::get('/customers', fn () => Inertia::render('customers/Index'))->name('customers');
Route::get('/customers-accounts', fn () => Inertia::render('customers/Accounts'))->name('customers.accounts');
Route::get('/customers/{customer}/account', fn ($customer) => Inertia::render('customers/AccountDetails', ['customer' => $customer]))->name('customers.account');
Route::get('/customers/{customer}/orders', fn ($customer) => Inertia::render('customers/CustomerOrders', ['customer' => $customer]))->name('customers.orders');

Route::get('/categories', fn () => Inertia::render('categories/Index'))->name('categories');

Route::get('/suppliers', fn () => Inertia::render('suppliers/Index'))->name('suppliers');
Route::get('/suppliers-accounts', fn () => Inertia::render('suppliers/SupplierAccounts'))->name('suppliers.accounts');
Route::get('/suppliers/receive', fn () => Inertia::render('suppliers/ReceiveOrder'))->name('suppliers.receive.empty');
Route::get('/suppliers/{supplier}/receive', fn ($supplier) => Inertia::render('suppliers/ReceiveOrder', ['supplier' => $supplier]))->name('suppliers.receive');
Route::get('/suppliers/{supplier}/account', fn ($supplier) => Inertia::render('suppliers/SupplierAccountDetails', ['supplier' => $supplier]))->name('suppliers.account');
Route::get('/suppliers/{supplier}/orders', fn ($supplier) => Inertia::render('suppliers/SupplierOrders', ['supplier' => $supplier]))->name('suppliers.orders');

Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
Route::get('/statistics', fn () => Inertia::render('statistics/Index'))->name('statistics');

// Sub-Admin Management Page (Admin Only)
Route::get('/sub-admins', fn () => Inertia::render('sub-admins/Index'))->name('sub-admins');

// Public Storage File Routes
Route::get('/app-storage/{id}/{filename}', function ($id, $filename) {
    $path = $id . '/' . $filename;
    $disk = \Illuminate\Support\Facades\Storage::disk('public');
    
    if (!$disk->exists($path)) {
        abort(404);
    }

    $file = $disk->get($path);
    $mime = $disk->mimeType($path);

    return response($file, 200)
        ->header('Content-Type', $mime)
        ->header('Cache-Control', 'public, max-age=86400');
})->name('app-storage.show');

Route::get('/settings-logo', function () {
    $logoPath = \App\Models\Setting::where('key', 'receipt_logo')->value('value');
    if (!$logoPath) abort(404);

    $disk = \Illuminate\Support\Facades\Storage::disk('public');
    if (!$disk->exists($logoPath)) abort(404);

    $file = $disk->get($logoPath);
    $mime = $disk->mimeType($logoPath);

    return response($file, 200)
        ->header('Content-Type', $mime)
        ->header('Cache-Control', 'public, max-age=86400');
})->name('settings.logo');

