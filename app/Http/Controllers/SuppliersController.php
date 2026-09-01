<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use App\Models\ReceivedOrder;
use App\Models\ReceivedOrderItem;
use App\Models\Product;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SuppliersController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Supplier::withCount('receivedOrders')
            ->withSum('receivedOrders', 'total_price');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('contact_name', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        $paginator = $query->latest()->simplePaginate(15);

        $suppliers = collect($paginator->items())->map(fn($s) => [
            'id'                    => $s->id,
            'name'                  => $s->name,
            'contact_name'          => $s->contact_name ?? '—',
            'phone'                 => $s->phone ?? '—',
            'address'               => $s->address ?? '—',
            'received_orders_count' => $s->received_orders_count,
            'total_purchased'       => number_format($s->received_orders_sum_total_price ?? 0, 2),
        ]);

        $products = Product::select('id', 'name', 'stock', 'price', 'cost_price', 'unit')
            ->orderBy('name')
            ->get()
            ->map(fn($p) => [
                'id'         => $p->id,
                'name'       => $p->name,
                'stock'      => $p->stock,
                'unit'       => $p->unit ?? '',
                'price'      => floatval($p->price),
                'cost_price' => floatval($p->cost_price ?? 0),
            ]);

        return Inertia::render('suppliers/Index', [
            'suppliers' => [
                'data'         => $suppliers,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'products'  => $products,
            'filters'   => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone'        => 'nullable|string|max:50',
            'address'      => 'nullable|string|max:500',
        ]);

        Supplier::create($data);

        return back()->with('success', 'تم إضافة المورد بنجاح.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone'        => 'nullable|string|max:50',
            'address'      => 'nullable|string|max:500',
        ]);

        $supplier->update($data);

        return back()->with('success', 'تم تحديث بيانات المورد.');
    }

    public function destroy(Supplier $supplier)
    {
        if ($supplier->receivedOrders()->exists()) {
            return back()->with('error', 'لا يمكن حذف هذا المورد لأنه يملك طلبات استلام مسجلة!');
        }

        $supplier->delete();
        return back()->with('success', 'تم حذف المورد.');
    }

    // ── Received Orders ──────────────────────────────────────────────────────

    public function supplierOrdersPage(Request $request, Supplier $supplier)
    {
        $paginator = $supplier->receivedOrders()
            ->with('items.product')
            ->latest()
            ->simplePaginate(15);

        $orders = collect($paginator->items())->map(fn($o) => [
            'id'           => $o->id,
            'total_price'  => floatval($o->total_price),
            'notes'        => $o->notes,
            'payment_type' => $o->payment_type ?? 'cash',
            'created_at'   => $o->created_at->translatedFormat('d M Y'),
            'items'        => $o->items->map(fn($item) => [
                'id'           => $item->id,
                'product_id'   => $item->product_id,
                'product_name' => $item->product->name ?? '—',
                'quantity'     => $item->quantity,
                'price'        => floatval($item->price),
                'total_price'  => floatval($item->total_price),
            ]),
        ]);

        $stats = $this->buildSupplierStats($supplier->id);

        return \Inertia\Inertia::render('suppliers/SupplierOrders', [
            'supplier' => [
                'id'           => $supplier->id,
                'name'         => $supplier->name,
                'contact_name' => $supplier->contact_name ?? '—',
                'phone'        => $supplier->phone ?? '—',
                'address'      => $supplier->address ?? '—',
            ],
            'orders' => [
                'data'         => $orders,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'stats' => $stats,
        ]);
    }

    /** AJAX: Return stats for a custom date range for a specific supplier. */
    public function supplierStatsRange(Request $request, Supplier $supplier)
    {
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);
        return response()->json($this->buildSupplierStats($supplier->id, $request->from, $request->to));
    }

    /** Build today / month / total / (optional) range stats for one supplier. */
    private function buildSupplierStats(int $id, $from = null, $to = null): array
    {
        $fmt = fn($v) => number_format((float)$v, 2) . ' ج.م';

        $spentQ = fn($s, $e) => (float) \App\Models\ReceivedOrder::where('supplier_id', $id)
            ->whereBetween('created_at', [\Carbon\Carbon::parse($s)->startOfDay(), \Carbon\Carbon::parse($e)->endOfDay()])
            ->sum('total_price');

        $ordersQ = fn($s, $e) => \App\Models\ReceivedOrder::where('supplier_id', $id)
            ->whereBetween('created_at', [\Carbon\Carbon::parse($s)->startOfDay(), \Carbon\Carbon::parse($e)->endOfDay()])
            ->count();

        $itemsQ = fn($s, $e) => (int) DB::table('received_order_items')
            ->join('received_orders', 'received_orders.id', '=', 'received_order_items.received_order_id')
            ->where('received_orders.supplier_id', $id)
            ->whereBetween('received_orders.created_at', [\Carbon\Carbon::parse($s)->startOfDay(), \Carbon\Carbon::parse($e)->endOfDay()])
            ->sum('received_order_items.quantity');

        $totalOrders   = \App\Models\ReceivedOrder::where('supplier_id', $id)->count();
        $totalSpent    = \App\Models\ReceivedOrder::where('supplier_id', $id)->sum('total_price');
        $totalItems    = (int) DB::table('received_order_items')
            ->join('received_orders', 'received_orders.id', '=', 'received_order_items.received_order_id')
            ->where('received_orders.supplier_id', $id)
            ->sum('received_order_items.quantity');
        $avgOrderValue = $totalOrders > 0 ? $totalSpent / $totalOrders : 0;

        $result = [
            'total' => [
                'orders_count'    => $totalOrders,
                'total_spent'     => $fmt($totalSpent),
                'total_items'     => $totalItems,
                'avg_order_value' => $fmt($avgOrderValue),
            ],
            'today' => [
                'spent'  => $fmt($spentQ(today(), today())),
                'orders' => $ordersQ(today(), today()),
                'items'  => $itemsQ(today(), today()),
            ],
            'month' => [
                'spent'  => $fmt($spentQ(now()->startOfMonth(), now()->endOfMonth())),
                'orders' => $ordersQ(now()->startOfMonth(), now()->endOfMonth()),
                'items'  => $itemsQ(now()->startOfMonth(), now()->endOfMonth()),
            ],
        ];

        if ($from && $to) {
            $result['range'] = [
                'spent'  => $fmt($spentQ($from, $to)),
                'orders' => $ordersQ($from, $to),
                'items'  => $itemsQ($from, $to),
                'from'   => $from,
                'to'     => $to,
            ];
        }

        return $result;
    }

    public function receivePage(Request $request, ?Supplier $supplier = null)
    {
        if (!$supplier && $request->has('supplier_id')) {
            $supplier = Supplier::find($request->input('supplier_id'));
        }

        $suppliers = Supplier::orderBy('name')->get()->map(fn($s) => [
            'id'           => $s->id,
            'name'         => $s->name,
            'contact_name' => $s->contact_name ?? '—',
            'phone'        => $s->phone ?? '—',
            'address'      => $s->address ?? '—',
            'balance'      => floatval($s->balance ?? 0),
        ]);

        $products = Product::select('id', 'name', 'stock', 'price', 'cost_price', 'unit')
            ->orderBy('name')
            ->get()
            ->map(fn($p) => [
                'id'         => $p->id,
                'name'       => $p->name,
                'stock'      => $p->stock,
                'unit'       => $p->unit ?? '',
                'price'      => floatval($p->price),
                'cost_price' => floatval($p->cost_price ?? 0),
            ]);

        return Inertia::render('suppliers/ReceiveOrder', [
            'selectedSupplier' => $supplier ? [
                'id'           => $supplier->id,
                'name'         => $supplier->name,
                'contact_name' => $supplier->contact_name ?? '—',
                'phone'        => $supplier->phone ?? '—',
                'address'      => $supplier->address ?? '—',
                'balance'      => floatval($supplier->balance ?? 0),
            ] : null,
            'suppliers' => $suppliers,
            'products'  => $products,
        ]);
    }

    public function receivedOrders(Supplier $supplier)
    {
        $orders = $supplier->receivedOrders()
            ->with('items.product')
            ->latest()
            ->get()
            ->map(fn($o) => [
                'id'           => $o->id,
                'total_price'  => floatval($o->total_price),
                'notes'        => $o->notes,
                'payment_type' => $o->payment_type ?? 'cash',
                'created_at'   => $o->created_at->translatedFormat('d M Y'),
                'items'        => $o->items->map(fn($item) => [
                    'id'           => $item->id,
                    'product_id'   => $item->product_id,
                    'product_name' => $item->product->name ?? '—',
                    'quantity'     => $item->quantity,
                    'price'        => floatval($item->price),
                    'total_price'  => floatval($item->total_price),
                ]),
            ]);

        return response()->json(['orders' => $orders]);
    }

    public function storeReceivedOrder(Request $request, Supplier $supplier)
    {
        $data = $request->validate([
            'notes'              => 'nullable|string',
            'payment_type'       => 'required|in:cash,credit',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.price'      => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $totalPrice = 0;
            foreach ($data['items'] as $item) {
                $totalPrice += $item['quantity'] * $item['price'];
            }

            $order = ReceivedOrder::create([
                'supplier_id'  => $supplier->id,
                'total_price'  => $totalPrice,
                'notes'        => $data['notes'] ?? null,
                'payment_type' => $data['payment_type'],
            ]);

            foreach ($data['items'] as $item) {
                ReceivedOrderItem::create([
                    'received_order_id' => $order->id,
                    'product_id'        => $item['product_id'],
                    'quantity'          => $item['quantity'],
                    'price'             => $item['price'],
                    'total_price'       => $item['quantity'] * $item['price'],
                ]);

                $product = Product::find($item['product_id']);
                $product->increment('stock', $item['quantity']);
                $product->update(['cost_price' => $item['price']]);
                if ($product->price < $item['price']) {
                    $product->update(['price' => $item['price']]);
                }
            }

            // If credit (آجل) => create a supplier transaction (debt owed)
            if ($data['payment_type'] === 'credit') {
                SupplierTransaction::create([
                    'supplier_id'       => $supplier->id,
                    'received_order_id' => $order->id,
                    'amount'            => $totalPrice,
                    'description'       => 'فاتورة شراء آجل #' . $order->id,
                ]);
            }

            DB::commit();
            return back()->with('success', 'تم تسجيل الطلب الوارد وتحديث المخزون بنجاح.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'حدث خطأ أثناء تسجيل الطلب: ' . $e->getMessage()]);
        }
    }

    // ── Supplier Accounts (حسابات الموردين) ──────────────────────────────────

    public function accountsIndex(Request $request)
    {
        $search = $request->input('search');

        $balances = SupplierTransaction::selectRaw('supplier_id, SUM(amount) as balance')
            ->groupBy('supplier_id')
            ->get();

        $totalOwed = 0; // total I owe to suppliers
        $totalPaid = 0; // total I have paid
        $suppliersWithDebt = 0;

        foreach ($balances as $b) {
            $bal = floatval($b->balance);
            if ($bal > 0) {
                $totalOwed += $bal;
                $suppliersWithDebt++;
            } elseif ($bal < 0) {
                $totalPaid += abs($bal);
            }
        }

        $globalStats = [
            'total_suppliers'       => Supplier::count(),
            'total_owed'            => round($totalOwed, 2),
            'total_paid'            => round($totalPaid, 2),
            'suppliers_with_debt'   => $suppliersWithDebt,
        ];

        // Suppliers with debts (ordered by balance desc)
        $suppliersWithDebtList = Supplier::with('transactions')
            ->get()
            ->map(function ($s) {
                $balance = $s->transactions->sum('amount');
                return [
                    'id'      => $s->id,
                    'name'    => $s->name,
                    'phone'   => $s->phone ?? '—',
                    'balance' => round($balance, 2),
                ];
            })
            ->filter(fn($s) => $s['balance'] > 0)
            ->sortByDesc('balance')
            ->values()
            ->take(5);

        // Paginated list
        $query = Supplier::select('suppliers.*')
            ->with(['transactions'])
            ->addSelect([
                'abs_balance' => SupplierTransaction::selectRaw('ABS(COALESCE(SUM(amount), 0))')
                    ->whereColumn('supplier_id', 'suppliers.id')
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%')
                  ->orWhere('contact_name', 'like', '%' . $search . '%');
            });
        }

        $paginator = $query->orderByDesc('abs_balance')->latest('suppliers.id')->simplePaginate(20);

        $suppliers = collect($paginator->items())->map(function ($s) {
            $balance = $s->transactions->sum('amount');
            return [
                'id'           => $s->id,
                'name'         => $s->name,
                'phone'        => $s->phone ?? '—',
                'contact_name' => $s->contact_name ?? '—',
                'balance'      => round($balance, 2),
            ];
        });

        return Inertia::render('suppliers/SupplierAccounts', [
            'suppliers' => [
                'data'         => $suppliers,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'globalStats'           => $globalStats,
            'suppliersWithDebtList' => $suppliersWithDebtList,
            'filters'               => ['search' => $search],
        ]);
    }

    public function accountDetails(Request $request, Supplier $supplier)
    {
        $paginator = SupplierTransaction::where('supplier_id', $supplier->id)
            ->with('receivedOrder')
            ->latest()
            ->simplePaginate(20);

        $transactions = collect($paginator->items())->map(function ($t) {
            return [
                'id'                => $t->id,
                'amount'            => round(floatval($t->amount), 2),
                'description'       => $t->description ?? '',
                'received_order_id' => $t->received_order_id,
                'date'              => $t->created_at ? $t->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
            ];
        });

        $aggregates = SupplierTransaction::where('supplier_id', $supplier->id)
            ->selectRaw('
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_debts,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_payments
            ')->first();

        $totalDebts    = floatval($aggregates->total_debts ?? 0);
        $totalPayments = floatval($aggregates->total_payments ?? 0);
        $balance       = $totalDebts - $totalPayments;

        return Inertia::render('suppliers/SupplierAccountDetails', [
            'supplier' => [
                'id'           => $supplier->id,
                'name'         => $supplier->name,
                'phone'        => $supplier->phone ?? '—',
                'contact_name' => $supplier->contact_name ?? '—',
                'address'      => $supplier->address ?? '—',
            ],
            'transactions' => [
                'data'         => $transactions,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'balance'        => round($balance, 2),
            'total_debts'    => round($totalDebts, 2),
            'total_payments' => round($totalPayments, 2),
        ]);
    }

    public function addTransaction(Request $request, Supplier $supplier)
    {
        $request->validate([
            'amount'      => 'required|numeric|not_in:0',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $isPayment = floatval($request->amount) < 0;

            SupplierTransaction::create([
                'supplier_id'       => $supplier->id,
                'received_order_id' => null,
                'amount'            => $request->amount,
                'description'       => $request->description ?? ($isPayment ? 'سداد يدوي للمورد' : 'إضافة مبلغ يدوي'),
            ]);

            $absAmount = abs($request->amount);
            $label = $isPayment ? 'سداد' : 'إضافة مبلغ';

            session()->flash('success', "تم تسجيل {$label} بقيمة " . number_format($absAmount, 2) . " ج.م بنجاح");
        } catch (\Exception $e) {
            Log::error("Failed to add transaction for supplier {$supplier->id}: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء تسجيل المعاملة');
        }

        return redirect()->route('suppliers.account', $supplier->id);
    }

    public function apiIndex(Request $request)
    {
        $search = $request->input('search');
        $query = Supplier::withCount('receivedOrders');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('contact_name', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        $paginator = $query->latest()->simplePaginate(15);
        $suppliers = collect($paginator->items())->map(fn($s) => [
            'id'                   => $s->id,
            'name'                 => $s->name,
            'contact_name'         => $s->contact_name ?? '—',
            'phone'                => $s->phone ?? '—',
            'address'              => $s->address ?? '—',
            'received_orders_count'=> $s->received_orders_count,
            'date'                 => $s->created_at ? $s->created_at->translatedFormat('F Y') : '—',
        ]);

        return response()->json([
            'suppliers' => [
                'data'         => $suppliers,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'filters' => ['search' => $search],
        ]);
    }

    public function apiStore(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone'        => 'nullable|string|max:20',
            'address'      => 'nullable|string|max:255',
        ]);

        $supplier = Supplier::create([
            'name'         => $request->name,
            'contact_name' => $request->contact_name,
            'phone'        => $request->phone,
            'address'      => $request->address,
        ]);

        return response()->json(['success' => true, 'message' => 'تم إضافة المورد بنجاح!', 'supplier' => $supplier]);
    }

    public function apiUpdate(Request $request, Supplier $supplier)
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone'        => 'nullable|string|max:20',
            'address'      => 'nullable|string|max:255',
        ]);

        $supplier->update([
            'name'         => $request->name,
            'contact_name' => $request->contact_name,
            'phone'        => $request->phone,
            'address'      => $request->address,
        ]);

        return response()->json(['success' => true, 'message' => 'تم تحديث بيانات المورد بنجاح!']);
    }

    public function apiDestroy(Supplier $supplier)
    {
        if ($supplier->receivedOrders()->exists()) {
            return response()->json(['success' => false, 'message' => 'لا يمكن حذف المورد لأنه مرتبط بطلبات استلام مسجلة!'], 422);
        }

        try {
            $supplier->delete();
            return response()->json(['success' => true, 'message' => 'تم حذف المورد بنجاح!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حذف المورد.'], 500);
        }
    }

    public function apiSupplierOrdersPage(Request $request, Supplier $supplier)
    {
        $paginator = $supplier->receivedOrders()
            ->with('items.product')
            ->latest()
            ->simplePaginate(15);

        $orders = collect($paginator->items())->map(fn($o) => [
            'id'           => $o->id,
            'total_price'  => floatval($o->total_price),
            'notes'        => $o->notes,
            'payment_type' => $o->payment_type ?? 'cash',
            'created_at'   => $o->created_at->translatedFormat('d M Y'),
            'items'        => $o->items->map(fn($item) => [
                'id'           => $item->id,
                'product_id'   => $item->product_id,
                'product_name' => $item->product->name ?? '—',
                'quantity'     => $item->quantity,
                'price'        => floatval($item->price),
                'total_price'  => floatval($item->total_price),
            ]),
        ]);

        $stats = $this->buildSupplierStats($supplier->id);

        return response()->json([
            'supplier' => [
                'id'           => $supplier->id,
                'name'         => $supplier->name,
                'contact_name' => $supplier->contact_name ?? '—',
                'phone'        => $supplier->phone ?? '—',
                'address'      => $supplier->address ?? '—',
            ],
            'orders' => [
                'data'         => $orders,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'stats' => $stats,
        ]);
    }

    public function apiSupplierStatsRange(Request $request, Supplier $supplier)
    {
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);
        return response()->json($this->buildSupplierStats($supplier->id, $request->from, $request->to));
    }

    public function apiReceivedOrders(Supplier $supplier)
    {
        return $this->receivedOrders($supplier);
    }

    public function apiStoreReceivedOrder(Request $request, Supplier $supplier)
    {
        $data = $request->validate([
            'notes'              => 'nullable|string',
            'payment_type'       => 'required|in:cash,credit',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.price'      => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $totalPrice = 0;
            foreach ($data['items'] as $item) {
                $totalPrice += $item['quantity'] * $item['price'];
            }

            $order = ReceivedOrder::create([
                'supplier_id'  => $supplier->id,
                'total_price'  => $totalPrice,
                'notes'        => $data['notes'] ?? null,
                'payment_type' => $data['payment_type'],
            ]);

            foreach ($data['items'] as $item) {
                ReceivedOrderItem::create([
                    'received_order_id' => $order->id,
                    'product_id'        => $item['product_id'],
                    'quantity'          => $item['quantity'],
                    'price'             => $item['price'],
                    'total_price'       => $item['quantity'] * $item['price'],
                ]);

                $product = Product::find($item['product_id']);
                $product->increment('stock', $item['quantity']);
                $product->update(['cost_price' => $item['price']]);
                if ($product->price < $item['price']) {
                    $product->update(['price' => $item['price']]);
                }
            }

            if ($data['payment_type'] === 'credit') {
                SupplierTransaction::create([
                    'supplier_id'       => $supplier->id,
                    'received_order_id' => $order->id,
                    'amount'            => $totalPrice,
                    'description'       => 'فاتورة شراء آجل #' . $order->id,
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الشحنة الواردة بنجاح وتحديث مخزون المنتجات!',
                'order'   => $order,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تسجيل الشحنة الواردة: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function apiAccountsIndex(Request $request)
    {
        $search = $request->input('search');

        $balances = SupplierTransaction::selectRaw('supplier_id, SUM(amount) as balance')
            ->groupBy('supplier_id')
            ->get();

        $totalOwed = 0;
        $totalPaid = 0;
        $suppliersWithDebt = 0;

        foreach ($balances as $b) {
            $bal = floatval($b->balance);
            if ($bal > 0) {
                $totalOwed += $bal;
                $suppliersWithDebt++;
            } elseif ($bal < 0) {
                $totalPaid += abs($bal);
            }
        }

        $globalStats = [
            'total_suppliers'       => Supplier::count(),
            'total_owed'            => round($totalOwed, 2),
            'total_paid'            => round($totalPaid, 2),
            'suppliers_with_debt'   => $suppliersWithDebt,
        ];

        $suppliersWithDebtList = Supplier::with('transactions')
            ->get()
            ->map(function ($s) {
                $balance = $s->transactions->sum('amount');
                return [
                    'id'      => $s->id,
                    'name'    => $s->name,
                    'phone'   => $s->phone ?? '—',
                    'balance' => round($balance, 2),
                ];
            })
            ->filter(fn($s) => $s['balance'] > 0)
            ->sortByDesc('balance')
            ->values()
            ->take(5);

        $query = Supplier::select('suppliers.*')
            ->with(['transactions'])
            ->addSelect([
                'abs_balance' => SupplierTransaction::selectRaw('ABS(COALESCE(SUM(amount), 0))')
                    ->whereColumn('supplier_id', 'suppliers.id')
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%')
                  ->orWhere('contact_name', 'like', '%' . $search . '%');
            });
        }

        $paginator = $query->orderByDesc('abs_balance')->latest('suppliers.id')->simplePaginate(20);

        $suppliers = collect($paginator->items())->map(function ($s) {
            $balance = floatval($s->transactions->sum('amount'));
            return [
                'id'           => $s->id,
                'name'         => $s->name,
                'phone'        => $s->phone ?? '—',
                'contact_name' => $s->contact_name ?? '—',
                'balance'      => round($balance, 2),
            ];
        });

        return response()->json([
            'suppliers' => [
                'data'         => $suppliers,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'globalStats'           => $globalStats,
            'suppliersWithDebtList' => $suppliersWithDebtList,
            'filters'               => ['search' => $search],
        ]);
    }

    public function apiAccountDetails(Request $request, Supplier $supplier)
    {
        $paginator = SupplierTransaction::where('supplier_id', $supplier->id)
            ->latest()
            ->simplePaginate(20);

        $transactions = collect($paginator->items())->map(function ($t) {
            return [
                'id'                => $t->id,
                'amount'            => round(floatval($t->amount), 2),
                'description'       => $t->description ?? '',
                'received_order_id' => $t->received_order_id,
                'date'              => $t->created_at ? $t->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
            ];
        });

        $aggregates = SupplierTransaction::where('supplier_id', $supplier->id)
            ->selectRaw('
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_debts,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_payments
            ')->first();

        $totalDebts    = floatval($aggregates->total_debts ?? 0);
        $totalPayments = floatval($aggregates->total_payments ?? 0);
        $balance       = $totalDebts - $totalPayments;

        return response()->json([
            'supplier' => [
                'id'           => $supplier->id,
                'name'         => $supplier->name,
                'phone'        => $supplier->phone ?? '—',
                'contact_name' => $supplier->contact_name ?? '—',
                'address'      => $supplier->address ?? '—',
            ],
            'transactions' => [
                'data'         => $transactions,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'balance'        => round($balance, 2),
            'total_debts'    => round($totalDebts, 2),
            'total_payments' => round($totalPayments, 2),
        ]);
    }

    public function apiAddTransaction(Request $request, Supplier $supplier)
    {
        $request->validate([
            'amount'      => 'required|numeric|not_in:0',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $isPayment = floatval($request->amount) < 0;

            SupplierTransaction::create([
                'supplier_id'       => $supplier->id,
                'received_order_id' => null,
                'amount'            => $request->amount,
                'description'       => $request->description ?? ($isPayment ? 'سداد يدوي للمورد' : 'إضافة مبلغ يدوي'),
            ]);

            $absAmount = abs($request->amount);
            $label = $isPayment ? 'سداد' : 'إضافة مبلغ';

            return response()->json([
                'success' => true,
                'message' => "تم تسجيل {$label} بقيمة " . number_format($absAmount, 2) . " ج.م بنجاح",
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تسجيل المعاملة'], 500);
        }
    }
}
