<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\posController;
use App\Http\Controllers\SuppliersController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\SettingsController;

use App\Http\Controllers\SubAdminController;

/*
|--------------------------------------------------------------------------
| API Routes (Laravel Sanctum)
|--------------------------------------------------------------------------
*/

// Public / Auth routes
Route::prefix('auth')->group(function () {
    Route::get('/check-registered', [AuthController::class, 'checkRegistered']);
    Route::post('/login', [AuthController::class, 'apiLogin']);
    Route::post('/register', [AuthController::class, 'apiRegister']);
    Route::post('/customer-register', [AuthController::class, 'customerRegister']);
    Route::post('/reset-password', [AuthController::class, 'apiResetPassword']);
    Route::post('/verify-reset-code', [AuthController::class, 'apiVerifyResetCode']);
});

// App settings logo public stream
Route::get('/settings-logo', [SettingsController::class, 'getLogo'])->name('api.settings.logo');

// Protected API Routes (Requires Sanctum Bearer Token)
Route::middleware('auth:sanctum')->group(function () {
    // Shared / Customer Endpoints
    Route::get('/products', [ProductsController::class, 'apiIndex']);
    Route::get('/categories', [CategoriesController::class, 'apiIndex']);
    Route::post('/orders', [OrdersController::class, 'apiStore']);

    // Auth details & logout
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'apiLogout']);
        Route::post('/fcm-token', [AuthController::class, 'updateFcmToken']);
    });

    // Staff Only Routes (Admin & Sub-Admin)
    Route::middleware('staff')->group(function () {
        // Dashboard Data
        Route::get('/dashboard', [DashboardController::class, 'apiIndex']);

        // POS Endpoints
        Route::get('/pos', [posController::class, 'apiPos']);
        Route::post('/pos/update-cart-item', [posController::class, 'apiUpdateCartItem']);
        Route::delete('/pos/delete-cart-item/{cartId}', [posController::class, 'apiDeleteCartItem']);
        Route::post('/pos/clear-cart/{cartId}', [posController::class, 'apiClearCart']);
        Route::post('/pos/pending-carts', [posController::class, 'apiSaveCart']);
        Route::delete('/pos/pending-carts/{id}', [posController::class, 'apiDeletePendingCart']);
        Route::post('/pos/pending-carts/swap', [posController::class, 'apiSwapCarts']);
        Route::post('/pos/complete-order', [posController::class, 'apiCompleteOrder']);

        // Products Management
        Route::post('/products', [ProductsController::class, 'apiStore']);
        Route::post('/products/import', [ProductsController::class, 'apiImport']);
        Route::match(['put', 'post'], '/products/{product}', [ProductsController::class, 'apiUpdate']);
        Route::delete('/products/{product}', [ProductsController::class, 'apiDestroy']);
        Route::get('/products/filter', [ProductsController::class, 'apiFilter']);

        // Categories Management
        Route::post('/categories', [CategoriesController::class, 'apiStore']);
        Route::put('/categories/{category}', [CategoriesController::class, 'apiUpdate']);
        Route::delete('/categories/{category}', [CategoriesController::class, 'apiDestroy']);

        // Orders Management
        Route::get('/orders', [OrdersController::class, 'apiIndex']);
        Route::get('/orders/{order}', [OrdersController::class, 'apiShow']);
        Route::put('/orders/{order}', [OrdersController::class, 'apiUpdate']);
        Route::delete('/orders/{order}', [OrdersController::class, 'apiDestroy']);
        Route::post('/orders/{order}/discount', [OrdersController::class, 'apiApplyDiscount']);
        Route::post('/orders/{order}/return', [OrdersController::class, 'apiReturnItems']);

        // Customers & Customer Accounts
        Route::get('/customers', [CustomersController::class, 'apiIndex']);
        Route::post('/customers', [CustomersController::class, 'apiStore']);
        Route::post('/customers/import', [CustomersController::class, 'apiImport']);
        Route::get('/customers/{customer}/orders', [CustomersController::class, 'apiCustomerOrders']);
        Route::get('/customers/{customer}/stats-range', [CustomersController::class, 'apiCustomerStatsRange']);
        Route::put('/customers/{customer}', [CustomersController::class, 'apiUpdate']);
        Route::delete('/customers/{customer}', [CustomersController::class, 'apiDestroy']);

        Route::get('/customers-accounts', [CustomersController::class, 'apiAccountsIndex']);
        Route::get('/customers/{customer}/account', [CustomersController::class, 'apiAccountDetails']);
        Route::post('/customers/{customer}/transaction', [CustomersController::class, 'apiAddTransaction']);

        // Suppliers & Supplier Accounts
        Route::get('/suppliers', [SuppliersController::class, 'apiIndex']);
        Route::post('/suppliers', [SuppliersController::class, 'apiStore']);
        Route::put('/suppliers/{supplier}', [SuppliersController::class, 'apiUpdate']);
        Route::delete('/suppliers/{supplier}', [SuppliersController::class, 'apiDestroy']);
        Route::get('/suppliers/{supplier}/orders', [SuppliersController::class, 'apiSupplierOrdersPage']);
        Route::get('/suppliers/{supplier}/stats-range', [SuppliersController::class, 'apiSupplierStatsRange']);
        Route::get('/suppliers/{supplier}/received-orders', [SuppliersController::class, 'apiReceivedOrders']);
        Route::post('/suppliers/{supplier}/received-orders', [SuppliersController::class, 'apiStoreReceivedOrder']);

        Route::get('/suppliers-accounts', [SuppliersController::class, 'apiAccountsIndex']);
        Route::get('/suppliers/{supplier}/account', [SuppliersController::class, 'apiAccountDetails']);
        Route::post('/suppliers/{supplier}/transaction', [SuppliersController::class, 'apiAddTransaction']);

        // Settings
        Route::get('/settings', [SettingsController::class, 'apiIndex']);
        Route::post('/settings', [SettingsController::class, 'apiUpdate']);

        // Statistics
        Route::get('/statistics', [StatisticsController::class, 'apiIndex']);
        Route::post('/statistics/verify-admin', [StatisticsController::class, 'apiVerifyAdmin']);
        Route::get('/statistics/range', [StatisticsController::class, 'apiRange']);

        // Sub-Admin Management
        Route::apiResource('sub-admins', SubAdminController::class);
    });
});
