<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // ── Sales chart: total revenue per month for the last 7 months ──────
        $arabicMonths = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس',    4 => 'أبريل',
            5 => 'مايو',  6 => 'يونيو',  7 => 'يوليو',   8 => 'أغسطس',
            9 => 'سبتمبر',10 => 'أكتوبر',11 => 'نوفمبر', 12 => 'ديسمبر',
        ];
        $salesData = collect();
        for ($i = 6; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $salesData->push([
                'month' => $arabicMonths[(int) $month->format('n')],
                'sales' => (float) Order::whereYear('created_at', $month->year)
                                        ->whereMonth('created_at', $month->month)
                                        ->sum('total_price'),
            ]);
        }

        // ── Top 5 best-selling products ──────────────────────────────────────
        $topProducts = DB::table('products_orders')
            ->join('products', 'products.id', '=', 'products_orders.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->select(
                'products.id',
                'products.name',
                'categories.name as category',
                DB::raw('SUM(products_orders.quantity) as total_sold'),
                DB::raw('SUM(products_orders.total_price) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'categories.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id'      => $p->id,
                'name'    => $p->name,
                'category'=> $p->category ?? '—',
                'sales'   => (int) $p->total_sold,
                'revenue' => number_format($p->total_revenue, 2) . ' ج.م',
            ]);

        // ── Recent orders (last 8) ────────────────────────────────────────────
        $recentOrders = Order::with(['user.profile', 'products'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn($order) => [
                'id'               => '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'raw_id'           => $order->id,
                'customer'         => $order->user?->name ?? 'غير معروف',
                'customer_address' => $order->user?->profile?->address ?? '',
                'customer_phone'   => $order->user?->profile?->phone_number ?? '',
                'items'            => $order->products->count(),
                'total'            => number_format(floatval($order->total_price), 2) . ' ج.م',
                'discount'         => floatval($order->discount ?? 0),
                'net_total'        => number_format(max(0, floatval($order->total_price) - floatval($order->discount ?? 0)), 2) . ' ج.م',
                'return_status'    => $order->return_status,
                'payment_type'     => $order->payment_type ?? 'كاش',
                'paid_amount'      => floatval($order->paid_amount ?? 0),
                'profit'           => floatval($order->profit ?? 0),
                'date'             => $order->created_at ? $order->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
                'previous_balance' => floatval($order->previous_balance ?? 0),
                'credit_used'      => floatval($order->credit_used ?? 0),
            ]);

        return Inertia::render('dashboard/Index', [
            'salesData'    => $salesData,
            'topProducts'  => $topProducts,
            'recentOrders' => $recentOrders,
        ]);
    }

    public function apiIndex()
    {
        $arabicMonths = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس',    4 => 'أبريل',
            5 => 'مايو',  6 => 'يونيو',  7 => 'يوليو',   8 => 'أغسطس',
            9 => 'سبتمبر',10 => 'أكتوبر',11 => 'نوفمبر', 12 => 'ديسمبر',
        ];
        $salesData = collect();
        for ($i = 6; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $salesData->push([
                'month' => $arabicMonths[(int) $month->format('n')],
                'sales' => (float) Order::whereYear('created_at', $month->year)
                                        ->whereMonth('created_at', $month->month)
                                        ->sum('total_price'),
            ]);
        }

        $topProducts = DB::table('products_orders')
            ->join('products', 'products.id', '=', 'products_orders.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->select(
                'products.id',
                'products.name',
                'categories.name as category',
                DB::raw('SUM(products_orders.quantity) as total_sold'),
                DB::raw('SUM(products_orders.total_price) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'categories.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id'      => $p->id,
                'name'    => $p->name,
                'category'=> $p->category ?? '—',
                'sales'   => (int) $p->total_sold,
                'revenue' => number_format($p->total_revenue, 2) . ' ج.م',
            ]);

        $recentOrders = Order::with(['user.profile', 'products'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn($order) => [
                'id'               => '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'raw_id'           => $order->id,
                'customer'         => $order->user?->name ?? 'غير معروف',
                'customer_address' => $order->user?->profile?->address ?? '',
                'customer_phone'   => $order->user?->profile?->phone_number ?? '',
                'items'            => $order->products->count(),
                'total'            => number_format(floatval($order->total_price), 2) . ' ج.م',
                'discount'         => floatval($order->discount ?? 0),
                'net_total'        => number_format(max(0, floatval($order->total_price) - floatval($order->discount ?? 0)), 2) . ' ج.م',
                'return_status'    => $order->return_status,
                'payment_type'     => $order->payment_type ?? 'كاش',
                'paid_amount'      => floatval($order->paid_amount ?? 0),
                'profit'           => floatval($order->profit ?? 0),
                'date'             => $order->created_at ? $order->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
                'previous_balance' => floatval($order->previous_balance ?? 0),
                'credit_used'      => floatval($order->credit_used ?? 0),
            ]);

        return response()->json([
            'salesData'    => $salesData,
            'topProducts'  => $topProducts,
            'recentOrders' => $recentOrders,
        ]);
    }
}
