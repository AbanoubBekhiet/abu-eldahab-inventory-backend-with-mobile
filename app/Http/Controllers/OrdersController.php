<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\Product;
use App\Models\User;
use App\Models\CustomerTransaction;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrdersController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Order::with(['user.profile', 'products', 'returns'])
            ->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', '%' . $search . '%')
                  ->orWhereHas('user', fn($uq) => $uq->where('name', 'like', '%' . $search . '%'))
                  ->orWhereHas('products', fn($pq) => $pq->where('name', 'like', '%' . $search . '%'));
            });
        }

        $paginator = $query->simplePaginate(15);

        $orders = collect($paginator->items())->map(fn($order) => $this->formatOrder($order, true));

        return Inertia::render('orders/Index', [
            'orders' => [
                'data'         => $orders,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Return a single order's full details (for the details modal).
     */
    public function show($id)
    {
        $order = Order::with(['user.profile', 'products', 'returns.product'])->findOrFail($id);

        return response()->json([
            'order' => $this->formatOrder($order, true),
        ]);
    }

    /**
     * Apply a discount to an order.
     */
    public function applyDiscount(Request $request, $id)
    {
        $request->validate([
            'discount' => 'required|numeric|min:0',
        ]);

        $order = Order::findOrFail($id);

        if ($request->discount > floatval($order->total_price)) {
            return back()->withErrors(['discount' => 'الخصم لا يمكن أن يكون أكبر من إجمالي الطلب.']);
        }

        try {
            DB::beginTransaction();

            $oldDiscount = floatval($order->discount ?? 0);
            $newDiscount = floatval($request->discount);
            $discountDelta = $newDiscount - $oldDiscount;

            $order->load(['products', 'returns']);
            $newProfit = 0;
            foreach ($order->products as $p) {
                $returnedQty = $order->returns->where('product_id', $p->id)->sum('quantity');
                $netQty = max(0, $p->pivot->quantity - $returnedQty);
                $newProfit += ($p->pivot->price - floatval($p->cost_price)) * $netQty;
            }
            $newProfit -= $newDiscount;

            $order->update([
                'discount' => $newDiscount,
                'profit'   => $newProfit,
            ]);

            // Adjust Customer Balance/Debt if order belongs to a customer and discount changed
            if ($order->user_id && $discountDelta != 0) {
                $orderLabel = '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT);
                $transactionAmount = -$discountDelta; // Negative reduces debt (or adds to credit), positive increases debt (or reduces credit)

                $description = $discountDelta > 0
                    ? "تطبيق/زيادة خصم بقيمة {$discountDelta} ج.م على طلب {$orderLabel}"
                    : "تخفيض الخصم بقيمة " . abs($discountDelta) . " ج.م على طلب {$orderLabel}";

                CustomerTransaction::create([
                    'user_id'     => $order->user_id,
                    'order_id'    => $order->id,
                    'amount'      => $transactionAmount,
                    'description' => $description,
                ]);
            }

            DB::commit();
            session()->flash('success', 'تم تطبيق وتعديل الخصم وتحديث حساب العميل بنجاح.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to apply discount on order {$id}: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء تطبيق الخصم.');
        }

        return redirect()->route('orders');
    }

    /**
     * Return one or more items (or the whole order).
     * Restores stock for returned quantities.
     */
    public function returnItems(Request $request, $id)
    {
        $request->validate([
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'reason'         => 'nullable|string|max:500',
        ]);

        $order = Order::with('products')->findOrFail($id);

        DB::beginTransaction();
        try {
            $totalRefund = 0;

            foreach ($request->items as $item) {
                // Find the pivot record to verify quantity
                $pivot = $order->products->firstWhere('id', $item['product_id']);

                if (!$pivot) {
                    throw new \Exception("المنتج غير موجود في هذا الطلب.");
                }

                $orderedQty = $pivot->pivot->quantity;

                // Check already returned quantity for this product
                $alreadyReturned = OrderReturn::where('order_id', $order->id)
                    ->where('product_id', $item['product_id'])
                    ->sum('quantity');

                $available = $orderedQty - $alreadyReturned;

                if ($item['quantity'] > $available) {
                    throw new \Exception("الكمية المطلوبة للمرتجع أكبر من الكمية المتاحة للمنتج.");
                }

                $unitPrice = floatval($pivot->pivot->price);
                $refund = $unitPrice * $item['quantity'];
                $totalRefund += $refund;

                // Create return record
                OrderReturn::create([
                    'order_id'      => $order->id,
                    'product_id'    => $item['product_id'],
                    'quantity'      => $item['quantity'],
                    'refund_amount' => $refund,
                    'reason'        => $request->reason,
                ]);

                // Restore stock
                Product::where('id', $item['product_id'])->increment('stock', $item['quantity']);
            }

            // Determine if the order is fully or partially returned
            $order->refresh()->load('products', 'returns');
            $isFullReturn = $order->products->every(function ($product) use ($order) {
                $orderedQty = $product->pivot->quantity;
                $returnedQty = $order->returns->where('product_id', $product->id)->sum('quantity');
                return $returnedQty >= $orderedQty;
            });

            $newProfit = 0;
            foreach ($order->products as $p) {
                $returnedQty = $order->returns->where('product_id', $p->id)->sum('quantity');
                $netQty = max(0, $p->pivot->quantity - $returnedQty);
                $newProfit += ($p->pivot->price - floatval($p->cost_price)) * $netQty;
            }
            $newProfit -= floatval($order->discount ?? 0);

            $order->update([
                'return_status' => $isFullReturn ? 'full' : 'partial',
                'profit'        => $newProfit,
            ]);

            DB::commit();
            session()->flash('success', 'تم تسجيل المرتجع بنجاح. مبلغ الاسترداد: ' . number_format($totalRefund, 2) . ' ج.م');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to return items for order {$id}: " . $e->getMessage());
            session()->flash('error', $e->getMessage() ?: 'حدث خطأ أثناء تسجيل المرتجع.');
        }

        return redirect()->route('orders');
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id'     => 'required|exists:users,id',
            'product_id'  => 'required|exists:products,id',
            'total_price' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $product = Product::findOrFail($request->product_id);
            $profit = floatval($request->total_price) - floatval($product->cost_price);

            $order = Order::create([
                'user_id'     => $request->user_id,
                'product_id'  => $request->product_id,
                'total_price' => $request->total_price,
                'status'      => 'pending',
                'profit'      => $profit,
            ]);

            DB::commit();
            session()->flash('success', 'تم إنشاء الطلب بنجاح!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to create order: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء إنشاء الطلب.');
        }

        return redirect()->route('orders');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,completed,delivered,cancelled',
        ]);

        $order = Order::findOrFail($id);
        try {
            $order->update(['status' => $request->status]);
            session()->flash('success', 'تم تحديث حالة الطلب بنجاح!');
        } catch (\Exception $e) {
            Log::error("Failed to update order {$id}: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء تحديث الطلب.');
        }

        return redirect()->route('orders');
    }

    public function destroy($id)
    {
        $order = Order::findOrFail($id);
        try {
            $order->delete();
            session()->flash('success', 'تم حذف الطلب بنجاح!');
        } catch (\Exception $e) {
            Log::error("Failed to delete order {$id}: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء حذف الطلب.');
        }

        return redirect()->route('orders');
    }

    // ── Private helper ─────────────────────────────────────────────────────

    private function formatOrder(Order $order, bool $withProducts = false): array
    {
        $status = $order->status ?? 'pending';
        $statusLabels = [
            'pending'   => 'قيد الانتظار',
            'shipped'   => 'تم الشحن',
            'completed' => 'تم التأكيد',
            'confirmed' => 'تم التأكيد',
            'cancelled' => 'ملغي',
        ];

        $base = [
            'id'               => '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
            'raw_id'           => $order->id,
            'customer'         => $order->user?->name ?? 'غير معروف',
            'customer_address' => $order->user?->profile?->address ?? '',
            'customer_phone'   => $order->user?->profile?->phone_number ?? '',
            'items'            => $order->products->count(),
            'total'            => number_format(floatval($order->total_price), 2) . ' ج.م',
            'total_amount'     => floatval($order->total_price),
            'discount'         => floatval($order->discount ?? 0),
            'net_total'        => number_format(max(0, floatval($order->total_price) - floatval($order->discount ?? 0)), 2) . ' ج.م',
            'status'           => $status,
            'status_label'     => $statusLabels[$status] ?? 'قيد الانتظار',
            'return_status'    => $order->return_status,
            'payment_type'     => $order->payment_type ?? 'كاش',
            'paid_amount'      => floatval($order->paid_amount ?? 0),
            'profit'           => floatval($order->profit ?? 0),
            'date'             => $order->created_at ? $order->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
            'previous_balance' => floatval($order->previous_balance ?? 0),
            'credit_used'      => floatval($order->credit_used ?? 0),
            'notes'            => $order->notes ?? '',
            'source'           => $order->source ?? 'pos',
        ];

        if ($withProducts) {
            $returnedMap = $order->returns->groupBy('product_id')->map(fn($r) => $r->sum('quantity'));

            $base['products'] = $order->products->map(function ($product) use ($returnedMap) {
                $orderedQty  = $product->pivot->quantity;
                $returnedQty = $returnedMap->get($product->id, 0);
                return [
                    'id'                     => $product->id,
                    'name'                   => $product->name,
                    'unit'                   => $product->unit ?? '',
                    'number_of_items_in_unit'=> intval($product->number_of_items_in_unit),
                    'quantity'               => $orderedQty,
                    'price'                  => floatval($product->pivot->price),
                    'total_price'            => floatval($product->pivot->total_price),
                    'returned_qty'           => $returnedQty,
                    'available_qty'          => max(0, $orderedQty - $returnedQty),
                ];
            })->values()->toArray();

            $base['returns'] = $order->returns->map(fn($r) => [
                'product_name'  => $r->product?->name ?? '—',
                'quantity'      => $r->quantity,
                'refund_amount' => floatval($r->refund_amount),
                'reason'        => $r->reason,
                'date'          => $r->created_at?->format('d M Y'),
            ])->values()->toArray();
        }

        return $base;
    }

    public function apiIndex(Request $request)
    {
        $search = $request->input('search');

        $query = Order::with(['user.profile', 'products', 'returns'])
            ->latest();

        if ($request->user() && ($request->user()->isCustomer() || $request->boolean('my_orders'))) {
            $query->where('user_id', $request->user()->id);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', '%' . $search . '%')
                  ->orWhereHas('user', fn($uq) => $uq->where('name', 'like', '%' . $search . '%'))
                  ->orWhereHas('products', fn($pq) => $pq->where('name', 'like', '%' . $search . '%'));
            });
        }

        $paginator = $query->simplePaginate(15);
        $orders = collect($paginator->items())->map(fn($order) => $this->formatOrder($order, true));

        return response()->json([
            'orders' => [
                'data'         => $orders,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function apiShow($id)
    {
        $order = Order::with(['user.profile', 'products', 'returns.product'])->findOrFail($id);

        return response()->json([
            'order' => $this->formatOrder($order, true),
        ]);
    }

    public function apiApplyDiscount(Request $request, $id)
    {
        $request->validate([
            'discount' => 'required|numeric|min:0',
        ]);

        $order = Order::findOrFail($id);

        if ($request->discount > floatval($order->total_price)) {
            return response()->json(['success' => false, 'message' => 'الخصم لا يمكن أن يكون أكبر من إجمالي الطلب.'], 422);
        }

        try {
            DB::beginTransaction();

            $oldDiscount = floatval($order->discount ?? 0);
            $newDiscount = floatval($request->discount);
            $discountDelta = $newDiscount - $oldDiscount;

            $order->load(['products', 'returns']);
            $newProfit = 0;
            foreach ($order->products as $p) {
                $returnedQty = $order->returns->where('product_id', $p->id)->sum('quantity');
                $netQty = max(0, $p->pivot->quantity - $returnedQty);
                $newProfit += ($p->pivot->price - floatval($p->cost_price)) * $netQty;
            }
            $newProfit -= $newDiscount;

            $order->update([
                'discount' => $newDiscount,
                'profit'   => $newProfit,
            ]);

            if ($order->user_id && $discountDelta != 0) {
                $orderLabel = '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT);
                $transactionAmount = -$discountDelta;

                $description = $discountDelta > 0
                    ? "تطبيق/زيادة خصم بقيمة {$discountDelta} ج.م على طلب {$orderLabel}"
                    : "تخفيض الخصم بقيمة " . abs($discountDelta) . " ج.م على طلب {$orderLabel}";

                CustomerTransaction::create([
                    'user_id'     => $order->user_id,
                    'order_id'    => $order->id,
                    'amount'      => $transactionAmount,
                    'description' => $description,
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'تم تطبيق وتعديل الخصم وتحديث حساب العميل بنجاح.',
                'order'   => $this->formatOrder($order->fresh(), true),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تطبيق الخصم: ' . $e->getMessage()], 500);
        }
    }

    public function apiReturnItems(Request $request, $id)
    {
        $request->validate([
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'reason'             => 'nullable|string|max:500',
        ]);

        $order = Order::with('products')->findOrFail($id);

        DB::beginTransaction();
        try {
            $totalRefund = 0;

            foreach ($request->items as $item) {
                $pivot = $order->products->firstWhere('id', $item['product_id']);

                if (!$pivot) {
                    throw new \Exception("المنتج غير موجود في هذا الطلب.");
                }

                $orderedQty = $pivot->pivot->quantity;
                $alreadyReturned = OrderReturn::where('order_id', $order->id)
                    ->where('product_id', $item['product_id'])
                    ->sum('quantity');

                $available = $orderedQty - $alreadyReturned;

                if ($item['quantity'] > $available) {
                    throw new \Exception("الكمية المطلوبة للمرتجع أكبر من الكمية المتاحة للمنتج.");
                }

                $unitPrice = floatval($pivot->pivot->price);
                $refund = $unitPrice * $item['quantity'];
                $totalRefund += $refund;

                OrderReturn::create([
                    'order_id'      => $order->id,
                    'product_id'    => $item['product_id'],
                    'quantity'      => $item['quantity'],
                    'refund_amount' => $refund,
                    'reason'        => $request->reason,
                ]);

                Product::where('id', $item['product_id'])->increment('stock', $item['quantity']);
            }

            $order->refresh()->load('products', 'returns');
            $isFullReturn = $order->products->every(function ($product) use ($order) {
                $orderedQty = $product->pivot->quantity;
                $returnedQty = $order->returns->where('product_id', $product->id)->sum('quantity');
                return $returnedQty >= $orderedQty;
            });

            $newProfit = 0;
            foreach ($order->products as $p) {
                $returnedQty = $order->returns->where('product_id', $p->id)->sum('quantity');
                $netQty = max(0, $p->pivot->quantity - $returnedQty);
                $newProfit += ($p->pivot->price - floatval($p->cost_price)) * $netQty;
            }
            $newProfit -= floatval($order->discount ?? 0);

            $order->update([
                'return_status' => $isFullReturn ? 'full' : 'partial',
                'profit'        => $newProfit,
            ]);

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل المرتجع بنجاح. مبلغ الاسترداد: ' . number_format($totalRefund, 2) . ' ج.م',
                'order'   => $this->formatOrder($order->fresh(), true),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage() ?: 'حدث خطأ أثناء تسجيل المرتجع.'], 422);
        }
    }

    public function apiStore(Request $request)
    {
        // Support mobile app multi-item checkout payload: { items: [{ product_id, quantity, unit_price }], notes: '...' }
        if ($request->has('items') && is_array($request->items)) {
            $request->validate([
                'items'              => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity'   => 'required|integer|min:1',
                'items.*.unit_price' => 'nullable|numeric|min:0',
                'notes'              => 'nullable|string|max:500',
            ]);

            // Determine customer ID (authenticated user or fallback to first customer / admin)
            $userId = $request->user() ? $request->user()->id : ($request->input('user_id') ?: User::where('role', 'customer')->value('id') ?: User::value('id'));

            DB::beginTransaction();
            try {
                $totalPrice = 0;
                $totalProfit = 0;

                // Determine if the requesting user is an admin/sub-admin (no limits apply)
                $requestingUser = $request->user();
                $isAdmin = $requestingUser && in_array(
                    strtolower($requestingUser->role ?? ''),
                    ['admin', 'sub_admin']
                );

                // Validate stock & max_app_order_quantity first
                foreach ($request->items as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    $qty = intval($item['quantity']);

                    // Only enforce max_app_order_quantity for customers
                    if (!$isAdmin && $product->max_app_order_quantity !== null && $qty > $product->max_app_order_quantity) {
                        return response()->json([
                            'success' => false,
                            'message' => "الكمية المطلوبة من المنتج '{$product->name}' تتجاوز الأقصى المسموح ({$product->max_app_order_quantity})"
                        ], 422);
                    }

                    if ($product->stock < $qty) {
                        return response()->json([
                            'success' => false,
                            'message' => "الكمية المطلوبة من المنتج '{$product->name}' غير متوفرة بالمخزن"
                        ], 422);
                    }

                    $unitPrice = isset($item['unit_price']) ? floatval($item['unit_price']) : floatval($product->price);
                    $totalPrice += $unitPrice * $qty;
                    $totalProfit += ($unitPrice - floatval($product->cost_price)) * $qty;
                }

                $firstItem = $request->items[0];

                // Fetch customer's current balance to record as previous_balance
                $previousBalance = CustomerTransaction::where('user_id', $userId)->sum('amount');

                $orderLabel = '#ORD-' . str_pad(0, 4, '0', STR_PAD_LEFT); // temp, will update after create

                $order = Order::create([
                    'user_id'          => $userId,
                    'product_id'       => $firstItem['product_id'],
                    'total_price'      => $totalPrice,
                    'status'           => 'pending',
                    'profit'           => $totalProfit,
                    'payment_type'     => 'آجل',
                    'paid_amount'      => 0,
                    'notes'            => $request->notes ?? 'طلب عبر تطبيق الموبايل',
                    'source'           => 'app',
                    'previous_balance' => $previousBalance,
                ]);

                foreach ($request->items as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    $qty = intval($item['quantity']);
                    $unitPrice = isset($item['unit_price']) ? floatval($item['unit_price']) : floatval($product->price);

                    DB::table('products_orders')->insert([
                        'order_id'    => $order->id,
                        'product_id'  => $product->id,
                        'quantity'    => $qty,
                        'price'       => $unitPrice,
                        'total_price' => $unitPrice * $qty,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);

                    // Deduct stock
                    $product->decrement('stock', $qty);
                }

                // Record the order total as a debt (ديون) in customer transactions
                $orderLabel = '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT);
                CustomerTransaction::create([
                    'user_id'     => $userId,
                    'order_id'    => $order->id,
                    'amount'      => $totalPrice, // positive = debt
                    'description' => "طلب عبر التطبيق {$orderLabel} - دين بقيمة " . number_format($totalPrice, 2) . ' ج.م',
                ]);

                DB::commit();
                return response()->json([
                    'success'  => true,
                    'message'  => 'تم تقديم طلبك بنجاح وسنقوم بالتواصل معك لتسليمه!',
                    'order_id' => $order->id,
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("Failed to create mobile order: " . $e->getMessage());
                return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء إنشاء الطلب: ' . $e->getMessage()], 500);
            }
        }

        // Single product fallback
        $request->validate([
            'user_id'     => 'required|exists:users,id',
            'product_id'  => 'required|exists:products,id',
            'total_price' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $product = Product::findOrFail($request->product_id);
            $profit = floatval($request->total_price) - floatval($product->cost_price);

            $order = Order::create([
                'user_id'     => $request->user_id,
                'product_id'  => $request->product_id,
                'total_price' => $request->total_price,
                'status'      => 'pending',
                'profit'      => $profit,
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'تم إنشاء الطلب بنجاح!', 'order' => $order]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء إنشاء الطلب.'], 500);
        }
    }

    public function apiUpdate(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,processing,shipped,delivered,completed,cancelled',
        ]);

        $order = Order::findOrFail($id);
        try {
            $order->update(['status' => $request->status]);
            return response()->json(['success' => true, 'message' => 'تم تحديث حالة الطلب بنجاح!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تحديث الطلب.'], 500);
        }
    }

    public function apiDestroy($id)
    {
        $order = Order::findOrFail($id);
        try {
            $order->delete();
            return response()->json(['success' => true, 'message' => 'تم حذف الطلب بنجاح!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حذف الطلب.'], 500);
        }
    }
}
