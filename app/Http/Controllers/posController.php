<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PendingCart;
use App\Models\PendingCartItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Category;
use App\Models\Order;
use App\Models\CustomerTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class posController extends Controller
{
    public function pos(Request $request)
    {
        $customers = User::where('role', 'customer')
            ->withSum('transactions as balance', 'amount')
            ->get()
            ->map(fn($c) => [
                'id'      => $c->id,
                'name'    => $c->name,
                'balance' => floatval($c->balance ?? 0)
            ]);
        $categories = Category::all();

        $productQuery = Product::with(['category', 'media']);

        if ($request->filled('query')) {
            $productQuery->where('name', 'like', '%' . $request->input('query') . '%');
        }

        if ($request->filled('category_id')) {
            $productQuery->where('category_id', $request->input('category_id'));
        }

        $products = $productQuery->paginate(30);
        $products->getCollection()->transform(function ($product) {
            $media = $product->getFirstMedia('products');
            $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;
            return [
                'id'                       => $product->id,
                'name'                     => $product->name,
                'price'                    => floatval($product->price),
                'cost_price'               => floatval($product->cost_price),
                'stock'                    => intval($product->stock),
                'unit'                     => $product->unit,
                'number_of_items_in_unit'  => intval($product->number_of_items_in_unit),
                'category_name'            => optional($product->category)->name ?? 'بدون قسم',
                'image_url'                => $imageUrl,
            ];
        });

        // Support pending_page for infinite scroll partial reloads
        // We load items and their product info so frontend can resume them.
        $pendingCarts = PendingCart::with(['customer:id,name', 'items.product'])
            ->latest()
            ->get();

        return Inertia::render('pos/Index', [
            'customers'    => $customers,
            'products'     => $products,
            'categories'   => $categories,
            'pendingCarts' => $pendingCarts,
        ]);
    }

    /**
     * Save the current working cart as a pending (held) cart.
     */
    public function saveCart(Request $request)
    {
        Log::info('saveCart Input:', $request->all());
        $request->validate([
            'customer_id' => 'required|exists:users,id',
            'items'       => 'required|array|min:1',
            'items.*.id'  => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'total'       => 'required|numeric|min:0',
            'items_count' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            $pendingCart = PendingCart::create([
                'customer_id' => $request->customer_id,
                'total'       => $request->total,
                'items_count' => $request->items_count,
            ]);

            foreach ($request->items as $item) {
                PendingCartItem::create([
                    'pending_cart_id' => $pendingCart->id,
                    'product_id'      => $item['id'],
                    'quantity'        => $item['quantity'],
                    'price'           => $item['price'],
                    'total_price'     => $item['price'] * $item['quantity'],
                ]);
            }

            DB::commit();
            session()->flash('success', 'تم حفظ السلة المعلقة بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save pending cart: ' . $e->getMessage());
            session()->flash('error', 'فشل حفظ السلة المعلقة');
        }

        return redirect()->route('pos');
    }

    /**
     * Swaps the current working cart with a pending cart.
     * The current working cart is saved as pending, and the target pending cart is resumed.
     */
    public function swapCarts(Request $request)
    {
        Log::info('swapCarts Input:', $request->all());
        $request->validate([
            'resume_pending_cart_id' => 'required|exists:pending_carts,id',
            // Active cart details (if active cart is not empty)
            'customer_id'            => 'nullable|exists:users,id',
            'items'                  => 'nullable|array',
            'items.*.id'             => 'nullable|exists:products,id',
            'items.*.quantity'       => 'nullable|integer|min:1',
            'items.*.price'          => 'nullable|numeric|min:0',
            'total'                  => 'nullable|numeric|min:0',
            'items_count'            => 'nullable|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            // 1. If active cart has items, save it as a new pending cart
            if (!empty($request->items)) {
                if (!$request->customer_id) {
                    session()->flash('error', 'يجب تحديد عميل لحفظ السلة الحالية');
                    return redirect()->route('pos');
                }

                $pendingCart = PendingCart::create([
                    'customer_id' => $request->customer_id,
                    'total'       => $request->total,
                    'items_count' => $request->items_count,
                ]);

                foreach ($request->items as $item) {
                    PendingCartItem::create([
                        'pending_cart_id' => $pendingCart->id,
                        'product_id'      => $item['id'],
                        'quantity'        => $item['quantity'],
                        'price'           => $item['price'],
                        'total_price'     => $item['price'] * $item['quantity'],
                    ]);
                }
            }

            // 2. Retrieve the pending cart to resume
            $resumedCart = PendingCart::with(['customer:id,name', 'items.product'])->findOrFail($request->resume_pending_cart_id);

            // 3. Format the data to pass back to the frontend
            $formattedItems = [];
            foreach ($resumedCart->items as $item) {
                $formattedItems[] = [
                    'id'          => $item->product->id,
                    'name'        => $item->product->name,
                    'price'       => floatval($item->price),
                    'cost_price'  => floatval($item->product->cost_price),
                    'quantity'    => intval($item->quantity),
                    'unit'        => $item->product->unit,
                    'image'       => $item->product->image,
                    'stock'       => $item->product->stock,
                ];
            }

            $resumedData = [
                'customer' => $resumedCart->customer,
                'items'    => $formattedItems,
            ];

            // 4. Delete the resumed cart from the database
            $resumedCart->delete();

            DB::commit();

            session()->flash('resumed_cart', $resumedData);
            session()->flash('success', 'تم استدعاء السلة المعلقة بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to swap carts: ' . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء تبديل السلات');
        }

        return redirect()->route('pos');
    }

    /**
     * Delete a pending cart by ID.
     */
    public function deletePendingCart($id)
    {
        $pendingCart = PendingCart::findOrFail($id);
        $pendingCart->delete();

        session()->flash('success', 'تم حذف السلة المعلقة بنجاح');
        return redirect()->route('pos');
    }

    /**
     * Completes making products in the cart as an order, deducts stock, and flashes details for receipt printing.
     */
    public function completeOrder(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:users,id',
            'items'       => 'required|array|min:1',
            'items.*.id'  => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'payment_type' => 'required|in:كاش,آجل',
            'paid_amount' => 'nullable|numeric|min:0',
        ]);

        $paidAmount = floatval($request->paid_amount ?? 0);

        DB::beginTransaction();
        try {
            // Verify stock first
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['id']);
                if ($product->stock < $item['quantity']) {
                    session()->flash('error', "الكمية المطلوبة من المنتج '{$product->name}' غير متوفرة بالمخزن");
                    return redirect()->route('pos');
                }
            }

            // Calculate previous balance
            $previousBalance = floatval(CustomerTransaction::where('user_id', $request->customer_id)->sum('amount'));
            $totalPrice = floatval($request->total_price);
            $creditUsed = 0;

            if ($previousBalance < 0) {
                $credit = abs($previousBalance);
                $creditUsed = min($totalPrice, $credit);
            }

            $netToPay = $totalPrice - $creditUsed;

            // Create Order
            $firstProduct = $request->items[0];

            $order = Order::create([
                'user_id'          => $request->customer_id,
                'product_id'       => $firstProduct['id'],
                'total_price'      => $request->total_price,
                'status'           => 'completed',
                'payment_type'     => $request->payment_type,
                'paid_amount'      => $request->payment_type === 'آجل' ? $paidAmount : $netToPay,
                'previous_balance' => $previousBalance,
                'credit_used'      => $creditUsed,
            ]);

            // Save order items & deduct stock
            $receiptItems = [];
            $totalProfit = 0;
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['id']);

                // Insert into products_orders pivot
                DB::table('products_orders')->insert([
                    'order_id'    => $order->id,
                    'product_id'  => $item['id'],
                    'quantity'    => $item['quantity'],
                    'price'       => $item['price'],
                    'total_price' => $item['price'] * $item['quantity'],
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

                // Deduct stock
                $product->decrement('stock', $item['quantity']);

                $totalProfit += ($item['price'] - floatval($product->cost_price)) * $item['quantity'];

                $receiptItems[] = [
                    'name'                   => $product->name,
                    'unit'                   => $product->unit ?? '',
                    'number_of_items_in_unit'=> intval($product->number_of_items_in_unit),
                    'quantity'               => $item['quantity'],
                    'price'                  => $item['price'],
                    'total_price'            => $item['price'] * $item['quantity'],
                ];
            }

            // Update order profit
            $order->update(['profit' => $totalProfit - floatval($order->discount ?? 0)]);

            $orderLabel = '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT);

            // Record transaction(s)
            if ($request->payment_type === 'كاش') {
                if ($creditUsed > 0) {
                    CustomerTransaction::create([
                        'user_id'     => $request->customer_id,
                        'order_id'    => $order->id,
                        'amount'      => $creditUsed, // Positive debit because we are using/reducing their credit (which was negative)
                        'description' => 'استهلاك رصيد دائن سابق - طلب ' . $orderLabel,
                    ]);
                }
            } else {
                // Record the full invoice as debt (positive = customer owes)
                CustomerTransaction::create([
                    'user_id'     => $request->customer_id,
                    'order_id'    => $order->id,
                    'amount'      => $totalPrice,
                    'description' => 'فاتورة آجل - طلب ' . $orderLabel,
                ]);

                if ($paidAmount > 0) {
                    CustomerTransaction::create([
                        'user_id'     => $request->customer_id,
                        'order_id'    => $order->id,
                        'amount'      => -$paidAmount,
                        'description' => 'دفعة جزئية عند الشراء - طلب ' . $orderLabel,
                    ]);
                }
            }

            $customer = User::with('profile')->findOrFail($request->customer_id);

            // Save receipt details for frontend print modal
            $completedOrderDetails = [
                'order_number'      => $orderLabel,
                'customer_name'     => $customer->name,
                'customer_address'  => $customer->profile?->address ?? '',
                'customer_phone'    => $customer->profile?->phone_number ?? '',
                'date'              => now()->locale('ar')->translatedFormat('j F Y g:i a'),
                'items'             => $receiptItems,
                'total_price'       => $totalPrice,
                'discount'          => floatval($order->discount ?? 0),
                'net_total'         => $totalPrice - floatval($order->discount ?? 0),
                'payment_type'      => $request->payment_type,
                'paid_amount'       => $request->payment_type === 'آجل' ? $paidAmount : $netToPay,
                'previous_balance'  => $previousBalance,
                'credit_used'       => $creditUsed,
            ];

            DB::commit();

            session()->flash('completed_order', $completedOrderDetails);
            session()->flash('success', 'تم تسجيل الطلب وخصم الكميات بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to complete order: ' . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء إتمام الطلب');
        }

        return redirect()->route('pos');
    }

    public function apiPos(Request $request)
    {
        $customers = User::where('role', 'customer')
            ->withSum('transactions as balance', 'amount')
            ->get()
            ->map(fn($c) => [
                'id'      => $c->id,
                'name'    => $c->name,
                'balance' => floatval($c->balance ?? 0)
            ]);
        $categories = Category::all();

        $productQuery = Product::with(['category', 'media']);

        if ($request->filled('query')) {
            $productQuery->where('name', 'like', '%' . $request->input('query') . '%');
        }

        if ($request->filled('category_id')) {
            $productQuery->where('category_id', $request->input('category_id'));
        }

        $products = $productQuery->paginate(30);
        $products->getCollection()->transform(function ($product) {
            $media = $product->getFirstMedia('products');
            $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;
            return [
                'id'                       => $product->id,
                'name'                     => $product->name,
                'price'                    => floatval($product->price),
                'cost_price'               => floatval($product->cost_price),
                'stock'                    => intval($product->stock),
                'unit'                     => $product->unit,
                'number_of_items_in_unit'  => intval($product->number_of_items_in_unit),
                'category_name'            => optional($product->category)->name ?? 'بدون قسم',
                'image_url'                => $imageUrl,
            ];
        });

        $pendingCarts = PendingCart::with(['customer:id,name', 'items.product'])
            ->latest()
            ->get();

        return response()->json([
            'customers'    => $customers,
            'products'     => $products,
            'categories'   => $categories,
            'pendingCarts' => $pendingCarts,
        ]);
    }

    public function apiSaveCart(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:users,id',
            'items'       => 'required|array|min:1',
            'items.*.id'  => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'total'       => 'required|numeric|min:0',
            'items_count' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            $pendingCart = PendingCart::create([
                'customer_id' => $request->customer_id,
                'total'       => $request->total,
                'items_count' => $request->items_count,
            ]);

            foreach ($request->items as $item) {
                PendingCartItem::create([
                    'pending_cart_id' => $pendingCart->id,
                    'product_id'      => $item['id'],
                    'quantity'        => $item['quantity'],
                    'price'           => $item['price'],
                    'total_price'     => $item['price'] * $item['quantity'],
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'تم حفظ السلة المعلقة بنجاح',
                'pending_cart' => $pendingCart,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'فشل حفظ السلة المعلقة: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function apiSwapCarts(Request $request)
    {
        $request->validate([
            'resume_pending_cart_id' => 'required|exists:pending_carts,id',
            'customer_id'            => 'nullable|exists:users,id',
            'items'                  => 'nullable|array',
            'items.*.id'             => 'nullable|exists:products,id',
            'items.*.quantity'       => 'nullable|integer|min:1',
            'items.*.price'          => 'nullable|numeric|min:0',
            'total'                  => 'nullable|numeric|min:0',
            'items_count'            => 'nullable|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            if (!empty($request->items)) {
                if (!$request->customer_id) {
                    return response()->json(['success' => false, 'message' => 'يجب تحديد عميل لحفظ السلة الحالية'], 422);
                }

                $pendingCart = PendingCart::create([
                    'customer_id' => $request->customer_id,
                    'total'       => $request->total,
                    'items_count' => $request->items_count,
                ]);

                foreach ($request->items as $item) {
                    PendingCartItem::create([
                        'pending_cart_id' => $pendingCart->id,
                        'product_id'      => $item['id'],
                        'quantity'        => $item['quantity'],
                        'price'           => $item['price'],
                        'total_price'     => $item['price'] * $item['quantity'],
                    ]);
                }
            }

            $resumedCart = PendingCart::with(['customer:id,name', 'items.product'])->findOrFail($request->resume_pending_cart_id);

            $formattedItems = [];
            foreach ($resumedCart->items as $item) {
                $formattedItems[] = [
                    'id'          => $item->product->id,
                    'name'        => $item->product->name,
                    'price'       => floatval($item->price),
                    'cost_price'  => floatval($item->product->cost_price),
                    'quantity'    => intval($item->quantity),
                    'unit'        => $item->product->unit,
                    'image'       => $item->product->image,
                    'stock'       => $item->product->stock,
                ];
            }

            $resumedData = [
                'customer' => $resumedCart->customer,
                'items'    => $formattedItems,
            ];

            $resumedCart->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم استدعاء السلة المعلقة بنجاح',
                'resumed_cart' => $resumedData,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تبديل السلات'], 500);
        }
    }

    public function apiDeletePendingCart($id)
    {
        $pendingCart = PendingCart::findOrFail($id);
        $pendingCart->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف السلة المعلقة بنجاح',
        ]);
    }

    public function apiCompleteOrder(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:users,id',
            'items'       => 'required|array|min:1',
            'items.*.id'  => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'payment_type' => 'required|in:كاش,آجل',
            'paid_amount' => 'nullable|numeric|min:0',
        ]);

        $paidAmount = floatval($request->paid_amount ?? 0);

        DB::beginTransaction();
        try {
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['id']);
                if ($product->stock < $item['quantity']) {
                    return response()->json([
                        'success' => false,
                        'message' => "الكمية المطلوبة من المنتج '{$product->name}' غير متوفرة بالمخزن"
                    ], 422);
                }
            }

            $previousBalance = floatval(CustomerTransaction::where('user_id', $request->customer_id)->sum('amount'));
            $totalPrice = floatval($request->total_price);
            $creditUsed = 0;

            if ($previousBalance < 0) {
                $credit = abs($previousBalance);
                $creditUsed = min($totalPrice, $credit);
            }

            $netToPay = $totalPrice - $creditUsed;
            $firstProduct = $request->items[0];

            $order = Order::create([
                'user_id'          => $request->customer_id,
                'product_id'       => $firstProduct['id'],
                'total_price'      => $request->total_price,
                'status'           => 'completed',
                'payment_type'     => $request->payment_type,
                'paid_amount'      => $request->payment_type === 'آجل' ? $paidAmount : $netToPay,
                'previous_balance' => $previousBalance,
                'credit_used'      => $creditUsed,
            ]);

            $receiptItems = [];
            $totalProfit = 0;
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['id']);

                DB::table('products_orders')->insert([
                    'order_id'    => $order->id,
                    'product_id'  => $item['id'],
                    'quantity'    => $item['quantity'],
                    'price'       => $item['price'],
                    'total_price' => $item['price'] * $item['quantity'],
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

                $product->decrement('stock', $item['quantity']);
                $totalProfit += ($item['price'] - floatval($product->cost_price)) * $item['quantity'];

                $receiptItems[] = [
                    'name'                   => $product->name,
                    'unit'                   => $product->unit ?? '',
                    'number_of_items_in_unit'=> intval($product->number_of_items_in_unit),
                    'quantity'               => $item['quantity'],
                    'price'                  => $item['price'],
                    'total_price'            => $item['price'] * $item['quantity'],
                ];
            }

            $order->update(['profit' => $totalProfit - floatval($order->discount ?? 0)]);
            $orderLabel = '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT);

            if ($request->payment_type === 'آجل') {
                CustomerTransaction::create([
                    'user_id'     => $request->customer_id,
                    'order_id'    => $order->id,
                    'amount'      => $totalPrice,
                    'description' => 'فاتورة آجل - طلب ' . $orderLabel,
                ]);

                if ($paidAmount > 0) {
                    CustomerTransaction::create([
                        'user_id'     => $request->customer_id,
                        'order_id'    => $order->id,
                        'amount'      => -$paidAmount,
                        'description' => 'دفعة جزئية عند الشراء - طلب ' . $orderLabel,
                    ]);
                }
            }

            $customer = User::with('profile')->findOrFail($request->customer_id);

            $completedOrderDetails = [
                'order_number'      => $orderLabel,
                'customer_name'     => $customer->name,
                'customer_address'  => $customer->profile?->address ?? '',
                'customer_phone'    => $customer->profile?->phone_number ?? '',
                'date'              => now()->locale('ar')->translatedFormat('j F Y g:i a'),
                'items'             => $receiptItems,
                'total_price'       => $totalPrice,
                'discount'          => floatval($order->discount ?? 0),
                'net_total'         => $totalPrice - floatval($order->discount ?? 0),
                'payment_type'      => $request->payment_type,
                'paid_amount'       => $request->payment_type === 'آجل' ? $paidAmount : $netToPay,
                'previous_balance'  => $previousBalance,
                'credit_used'       => $creditUsed,
            ];

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الطلب وخصم الكميات بنجاح',
                'completed_order' => $completedOrderDetails,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إتمام الطلب: ' . $e->getMessage()
            ], 500);
        }
    }
}
