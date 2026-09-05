<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Profile;
use App\Models\Product;
use App\Models\Category;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Imports\SimpleArrayImport;
use Maatwebsite\Excel\Facades\Excel;

class CustomersController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        
        $query = User::where('role', 'customer')->with(['profile', 'orders']);
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhereHas('profile', function($pq) use ($search) {
                      $pq->where('phone_number', 'like', '%' . $search . '%')
                        ->orWhere('shop_name', 'like', '%' . $search . '%')
                        ->orWhere('address', 'like', '%' . $search . '%');
                  });
            });
        }
        
        $paginator = $query->latest()->simplePaginate(15);
        
        $customers = collect($paginator->items())->map(function($user) {
            // Customers registered from the app have a profile with latitude/longitude or a password (self-registered)
            $hasPassword   = !empty($user->password);
            $hasCoords     = $user->profile?->latitude !== null || $user->profile?->longitude !== null;
            $fromApp       = $hasPassword && $hasCoords;

            // Calculate balance
            $aggregates = \App\Models\CustomerTransaction::where('user_id', $user->id)
                ->selectRaw('
                    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_debts,
                    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_payments
                ')->first();
            $balance = round(floatval($aggregates->total_debts ?? 0) - floatval($aggregates->total_payments ?? 0), 2);

            return [
                'id'                   => $user->id,
                'name'                 => $user->name,
                'email'                => $user->email ?? '—',
                'phone'                => $user->profile?->phone_number ?? '—',
                'address'              => $user->profile?->address ?? '—',
                'shop_name'            => $user->profile?->shop_name ?? '—',
                'category_of_place'    => $user->profile?->category_of_place ?? '—',
                'orders_count'         => $user->orders->count(),
                'total_spent'          => number_format($user->orders->sum('total_price'), 2) . ' ج',
                'status'               => 'active',
                'joined'               => $user->created_at ? $user->created_at->translatedFormat('F Y') : '—',
                'registered_from_app'  => $fromApp,
                'balance'              => $balance,
            ];
        });

        return Inertia::render('customers/Index', [
            'customers' => [
                'data' => $customers,
                'next_page' => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'filters' => ['search' => $search]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email|max:255',
            'phone_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'shop_name' => 'required|string|max:255',
            'category_of_place' => 'nullable|string|max:255',
            'region_id' => 'nullable|exists:regions,id',
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name'  => $request->name,
                'email' => $request->email,
                'role'  => 'customer',
            ]);

            Profile::create([
                'user_id' => $user->id,
                'phone_number' => $request->phone_number,
                'address' => $request->address,
                'shop_name' => $request->shop_name,
                'category_of_place' => $request->category_of_place,
                'region_id' => $request->region_id,
            ]);

            DB::commit();
            session()->flash('success', 'تم إضافة العميل بنجاح!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to add customer: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء إضافة العميل: ' . $e->getMessage());
        }

        return redirect()->route('customers');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id . '|max:255',
            'phone_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'shop_name' => 'required|string|max:255',
            'category_of_place' => 'nullable|string|max:255',
            'region_id' => 'nullable|exists:regions,id',
        ]);

        DB::beginTransaction();
        try {
            $user->update([
                'name' => $request->name,
                'email' => $request->email,
            ]);

            $profile = Profile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'phone_number' => $request->phone_number,
                    'address' => $request->address,
                    'shop_name' => $request->shop_name,
                    'category_of_place' => $request->category_of_place,
                    'region_id' => $request->region_id,
                ]
            );

            DB::commit();
            session()->flash('success', 'تم تحديث بيانات العميل بنجاح!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to update customer {$id}: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء تحديث بيانات العميل: ' . $e->getMessage());
        }

        return redirect()->route('customers');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        try {
            // Check if user has orders
            if ($user->orders()->exists()) {
                session()->flash('error', 'لا يمكن حذف هذا العميل لوجود طلبات مسجلة باسمه!');
                return redirect()->route('customers');
            }
            
            $user->delete();
            session()->flash('success', 'تم حذف العميل بنجاح!');
        } catch (\Exception $e) {
            Log::error("Failed to delete customer {$id}: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء حذف العميل: ' . $e->getMessage());
        }

        return redirect()->route('customers');
    }

    public function customerOrders(Request $request, $id)
    {
        $user = User::with('profile')->findOrFail($id);

        $paginator = \App\Models\Order::with(['products', 'returns'])
            ->where('user_id', $id)
            ->latest()
            ->simplePaginate(15);

        $orders = collect($paginator->items())->map(function ($order) {
            $returnedMap = $order->returns->groupBy('product_id')->map(fn($r) => $r->sum('quantity'));
            return [
                'id'            => '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'raw_id'        => $order->id,
                'items'         => $order->products->count(),
                'total'         => number_format(floatval($order->total_price), 2) . ' ج.م',
                'discount'      => floatval($order->discount ?? 0),
                'net_total'     => number_format(max(0, floatval($order->total_price) - floatval($order->discount ?? 0)), 2) . ' ج.م',
                'return_status' => $order->return_status,
                'payment_type'  => $order->payment_type ?? 'كاش',
                'profit'        => floatval($order->profit ?? 0),
                'date'          => $order->created_at ? $order->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
                'products'      => $order->products->map(function ($product) use ($returnedMap) {
                    $orderedQty  = $product->pivot->quantity;
                    $returnedQty = $returnedMap->get($product->id, 0);
                    return [
                        'id'           => $product->id,
                        'name'         => $product->name,
                        'unit'         => $product->unit ?? '',
                        'quantity'     => $orderedQty,
                        'price'        => floatval($product->pivot->price),
                        'total_price'  => floatval($product->pivot->total_price),
                        'returned_qty' => $returnedQty,
                        'available_qty'=> max(0, $orderedQty - $returnedQty),
                    ];
                })->values()->toArray(),
                'returns'       => $order->returns->map(fn($r) => [
                    'product_name'  => $r->product?->name ?? '—',
                    'quantity'      => $r->quantity,
                    'refund_amount' => floatval($r->refund_amount),
                    'reason'        => $r->reason,
                    'date'          => $r->created_at?->format('d M Y'),
                ])->values()->toArray(),
            ];
        });

        $stats = $this->buildCustomerStats($id);

        return Inertia::render('customers/CustomerOrders', [
            'customer' => [
                'id'       => $user->id,
                'name'     => $user->name,
                'phone'    => $user->profile?->phone_number ?? '—',
                'address'  => $user->profile?->address ?? '—',
                'shop_name'=> $user->profile?->shop_name ?? '—',
            ],
            'orders' => [
                'data'         => $orders,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'stats' => $stats,
        ]);
    }

    /** AJAX: Return stats for a custom date range for a specific customer. */
    public function customerStatsRange(Request $request, $id)
    {
        User::findOrFail($id);
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);
        return response()->json($this->buildCustomerStats($id, $request->from, $request->to));
    }

    /** Build today / month / total / (optional) range stats for one customer. */
    private function buildCustomerStats(int $id, $from = null, $to = null): array
    {
        $fmt = fn($v) => number_format((float)$v, 2) . ' ج.م';

        $salesQ = fn($s, $e) => (float) \App\Models\Order::where('user_id', $id)
            ->whereBetween('created_at', [\Carbon\Carbon::parse($s)->startOfDay(), \Carbon\Carbon::parse($e)->endOfDay()])
            ->selectRaw('SUM(total_price - COALESCE(discount,0)) as s')->value('s');

        $discountQ = fn($s, $e) => (float) \App\Models\Order::where('user_id', $id)
            ->whereBetween('created_at', [\Carbon\Carbon::parse($s)->startOfDay(), \Carbon\Carbon::parse($e)->endOfDay()])
            ->selectRaw('SUM(COALESCE(discount,0)) as d')->value('d');

        $ordersQ = fn($s, $e) => \App\Models\Order::where('user_id', $id)
            ->whereBetween('created_at', [\Carbon\Carbon::parse($s)->startOfDay(), \Carbon\Carbon::parse($e)->endOfDay()])
            ->count();

        $profitQ = function ($s, $e) use ($id) {
            $gross = (float) DB::table('products_orders')
                ->join('orders', 'orders.id', '=', 'products_orders.order_id')
                ->join('products', 'products.id', '=', 'products_orders.product_id')
                ->where('orders.user_id', $id)
                ->whereBetween('orders.created_at', [\Carbon\Carbon::parse($s)->startOfDay(), \Carbon\Carbon::parse($e)->endOfDay()])
                ->selectRaw('SUM((products_orders.price - products.cost_price) * products_orders.quantity) as p')->value('p');
            $returned = (float) DB::table('order_returns')
                ->join('orders', 'orders.id', '=', 'order_returns.order_id')
                ->join('products_orders', fn($j) => $j
                    ->on('products_orders.order_id', '=', 'order_returns.order_id')
                    ->on('products_orders.product_id', '=', 'order_returns.product_id'))
                ->join('products', 'products.id', '=', 'order_returns.product_id')
                ->where('orders.user_id', $id)
                ->whereBetween('orders.created_at', [\Carbon\Carbon::parse($s)->startOfDay(), \Carbon\Carbon::parse($e)->endOfDay()])
                ->selectRaw('SUM((products_orders.price - products.cost_price) * order_returns.quantity) as rp')->value('rp');
            return $gross - $returned;
        };

        $result = [
            'total' => [
                'orders_count'   => \App\Models\Order::where('user_id', $id)->count(),
                'total_sales'    => $fmt(\App\Models\Order::where('user_id', $id)->selectRaw('SUM(total_price - COALESCE(discount,0)) as s')->value('s') ?? 0),
                'total_discount' => $fmt(\App\Models\Order::where('user_id', $id)->selectRaw('SUM(COALESCE(discount,0)) as d')->value('d') ?? 0),
                'total_profit'   => $fmt($profitQ('2000-01-01', now()->endOfDay()->toDateTimeString())),
            ],
            'today' => [
                'sales'    => $fmt($salesQ(today(), today())),
                'profit'   => $fmt($profitQ(today(), today())),
                'orders'   => $ordersQ(today(), today()),
                'discount' => $fmt($discountQ(today(), today())),
            ],
            'month' => [
                'sales'    => $fmt($salesQ(now()->startOfMonth(), now()->endOfMonth())),
                'profit'   => $fmt($profitQ(now()->startOfMonth(), now()->endOfMonth())),
                'orders'   => $ordersQ(now()->startOfMonth(), now()->endOfMonth()),
                'discount' => $fmt($discountQ(now()->startOfMonth(), now()->endOfMonth())),
            ],
        ];

        if ($from && $to) {
            $result['range'] = [
                'sales'    => $fmt($salesQ($from, $to)),
                'profit'   => $fmt($profitQ($from, $to)),
                'orders'   => $ordersQ($from, $to),
                'discount' => $fmt($discountQ($from, $to)),
                'from'     => $from,
                'to'       => $to,
            ];
        }

        return $result;
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
        ]);

        $file = $request->file('file');
        $ext  = strtolower($file->getClientOriginalExtension());

        if (!in_array($ext, ['csv', 'xlsx', 'xls', 'txt'])) {
            session()->flash('error', 'امتداد الملف غير مدعوم. يرجى رفع ملف CSV أو Excel (xlsx/xls).');
            return redirect()->back();
        }

        try {
            // Remove time limit — large files can take longer than 30s
            set_time_limit(0);

            $import = new SimpleArrayImport();
            Excel::import($import, $file);
            $rows = $import->getData();
            if (empty($rows)) {
                session()->flash('error', 'ملف الاستيراد فارغ أو غير صالح!');
                return redirect()->back();
            }

            // Read header row
            $header = array_shift($rows);

            // Clean headers (remove BOM or spaces)
            $header = array_map(function($h) {
                return trim(preg_replace('/[\x00-\x1F\x7F-\x9F\xEF\xBB\xBF]/', '', $h));
            }, $header);

            $map = [];
            foreach ($header as $index => $col) {
                $colLower = strtolower($col);
                if ($colLower === 'name' || $col === 'الاسم') {
                    $map['name'] = $index;
                } elseif ($colLower === 'shop_name' || $col === 'المحل' || $col === 'اسم المحل') {
                    $map['shop_name'] = $index;
                } elseif ($colLower === 'email' || $col === 'البريد الالكتروني' || $col === 'البريد') {
                    $map['email'] = $index;
                } elseif ($colLower === 'phone' || $colLower === 'phone_number' || $col === 'الهاتف' || $col === 'رقم الهاتف') {
                    $map['phone_number'] = $index;
                } elseif ($colLower === 'address' || $col === 'العنوان') {
                    $map['address'] = $index;
                } elseif ($colLower === 'category' || $colLower === 'category_of_place' || $col === 'تصنيف المحل' || $col === 'الفئة') {
                    $map['category_of_place'] = $index;
                }
            }

            // Validate headers: name and shop_name are required
            if (!isset($map['name']) || !isset($map['shop_name'])) {
                session()->flash('error', 'تنسيق الملف غير صحيح! يجب أن يحتوي الملف على عمودين رئيسيين باسم "الاسم" و "اسم المحل".');
                return redirect()->back();
            }

            $imported = 0;
            $skipped  = 0;

            DB::beginTransaction();
            foreach ($rows as $row) {
                if (empty($row) || !isset($row[$map['name']]) || !isset($row[$map['shop_name']])) {
                    $skipped++;
                    continue;
                }

                $name     = trim($row[$map['name']]);
                $shopName = trim($row[$map['shop_name']]);

                if (!$name || !$shopName) {
                    $skipped++;
                    continue;
                }

                $email           = isset($map['email'])           ? (trim($row[$map['email']] ?? '') ?: null)           : null;
                $phone           = isset($map['phone_number'])    ? (trim($row[$map['phone_number']] ?? '') ?: null)    : null;
                $address         = isset($map['address'])         ? (trim($row[$map['address']] ?? '') ?: null)         : null;
                $categoryOfPlace = isset($map['category_of_place']) ? (trim($row[$map['category_of_place']] ?? '') ?: null) : null;

                // Skip duplicate emails
                if ($email && User::where('email', $email)->exists()) {
                    $email = null;
                }

                // No password needed — customers never log in
                $userId = DB::table('users')->insertGetId([
                    'name'       => $name,
                    'email'      => $email,
                    'role'       => 'customer',
                    'password'   => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                Profile::create([
                    'user_id'           => $userId,
                    'phone_number'      => $phone,
                    'address'           => $address,
                    'shop_name'         => $shopName,
                    'category_of_place' => $categoryOfPlace,
                ]);

                $imported++;
            }
            DB::commit();
            session()->flash('success', "تم استيراد {$imported} عميل بنجاح! تم تخطي {$skipped} عملاء بسبب بيانات غير مكتملة.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to import customers: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء استيراد العملاء: ' . $e->getMessage());
        }

        return redirect()->route('customers');
    }

    public function accountsIndex(Request $request)
    {
        $search = $request->input('search');

        $balances = \App\Models\CustomerTransaction::selectRaw('user_id, SUM(amount) as balance')
            ->groupBy('user_id')
            ->get();

        $totalDebtsOnCustomers = 0; // الفلوس اللي على العملاء
        $totalDebtsForCustomers = 0; // الفلوس اللي للعملاء
        $customersWithDebt = 0;

        foreach ($balances as $b) {
            $bal = floatval($b->balance);
            if ($bal > 0) {
                $totalDebtsOnCustomers += $bal;
                $customersWithDebt++;
            } elseif ($bal < 0) {
                $totalDebtsForCustomers += abs($bal);
            }
        }

        $globalStats = [
            'total_customers'           => User::where('role', 'customer')->count(),
            'total_debts_on_customers'  => round($totalDebtsOnCustomers, 2),
            'total_debts_for_customers' => round($totalDebtsForCustomers, 2),
            'customers_with_debt'       => $customersWithDebt,
        ];

        // Paginated customer list
        $query = User::where('role', 'customer')
            ->select('users.*')
            ->with(['profile', 'transactions'])
            ->addSelect([
                'abs_balance' => \App\Models\CustomerTransaction::selectRaw('ABS(COALESCE(SUM(amount), 0))')
                    ->whereColumn('user_id', 'users.id')
            ]);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhereHas('profile', function($pq) use ($search) {
                      $pq->where('phone_number', 'like', '%' . $search . '%')
                        ->orWhere('shop_name', 'like', '%' . $search . '%');
                  });
            });
        }

        $paginator = $query->orderByDesc('abs_balance')->latest('users.id')->simplePaginate(20);

        $customers = collect($paginator->items())->map(function($user) {
            $balance = $user->transactions->sum('amount'); // positive = owes money

            return [
                'id'        => $user->id,
                'name'      => $user->name,
                'phone'     => $user->profile?->phone_number ?? '—',
                'shop_name' => $user->profile?->shop_name ?? '—',
                'address'   => $user->profile?->address ?? '—',
                'balance'   => round($balance, 2),
            ];
        });

        return Inertia::render('customers/Accounts', [
            'customers' => [
                'data'         => $customers,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'globalStats' => $globalStats,
            'filters'     => ['search' => $search],
        ]);
    }

    /**
     * Full page showing transaction history for a specific customer.
     */
    public function accountDetails(Request $request, $id)
    {
        $user = User::with('profile')->findOrFail($id);

        // Auto sync any customer order that does not have a corresponding CustomerTransaction entry
        $existingOrderIdsInTx = \App\Models\CustomerTransaction::where('user_id', $id)
            ->whereNotNull('order_id')
            ->pluck('order_id')
            ->toArray();

        $unlinkedOrders = \App\Models\Order::where('user_id', $id)
            ->whereNotIn('id', $existingOrderIdsInTx)
            ->where('payment_type', '!=', 'كاش')
            ->get();

        foreach ($unlinkedOrders as $ord) {
            $orderLabel = '#ORD-' . str_pad($ord->id, 4, '0', STR_PAD_LEFT);
            \App\Models\CustomerTransaction::create([
                'user_id'     => $id,
                'order_id'    => $ord->id,
                'amount'      => floatval($ord->total_price),
                'description' => "طلب {$orderLabel} بقيمة " . number_format($ord->total_price, 2) . ' ج.م',
                'created_at'  => $ord->created_at,
                'updated_at'  => $ord->updated_at,
            ]);
        }

        $paginator = $user->transactions()
            ->latest()
            ->simplePaginate(20);

        $transactions = collect($paginator->items())->map(function ($t) use ($id) {
            $prevBalance = \App\Models\CustomerTransaction::where('user_id', $id)
                ->where(function($q) use ($t) {
                    $q->where('created_at', '<', $t->created_at)
                      ->orWhere(function($sub) use ($t) {
                          $sub->where('created_at', '=', $t->created_at)
                              ->where('id', '<', $t->id);
                      });
                })
                ->sum('amount');

            $amount = floatval($t->amount);
            $newBalance = floatval($prevBalance) + $amount;

            return [
                'id'               => $t->id,
                'amount'           => round($amount, 2),
                'previous_balance' => round(floatval($prevBalance), 2),
                'new_balance'      => round(floatval($newBalance), 2),
                'description'      => $t->description ?? '',
                'order_id'         => $t->order_id,
                'date'             => $t->created_at ? $t->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
            ];
        });

        // Compute global totals from DB
        $aggregates = \App\Models\CustomerTransaction::where('user_id', $id)
            ->selectRaw('
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_debts,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_payments
            ')->first();

        $totalDebts    = floatval($aggregates->total_debts ?? 0);
        $totalPayments = floatval($aggregates->total_payments ?? 0);
        $balance       = $totalDebts - $totalPayments;

        return Inertia::render('customers/AccountDetails', [
            'customer' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'phone'     => $user->profile?->phone_number ?? '—',
                'shop_name' => $user->profile?->shop_name ?? '—',
                'address'   => $user->profile?->address ?? '—',
            ],
            'transactions' => [
                'data'         => $transactions,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'balance'       => round($balance, 2),
            'total_debts'   => round($totalDebts, 2),
            'total_payments'=> round($totalPayments, 2),
        ]);
    }

    public function addTransaction(Request $request, $id)
    {
        $request->validate([
            'amount'      => 'required|numeric|not_in:0',
            'description' => 'nullable|string|max:500',
        ]);

        User::findOrFail($id);

        try {
            $isPayment = floatval($request->amount) < 0;

            \App\Models\CustomerTransaction::create([
                'user_id'     => $id,
                'order_id'    => null,
                'amount'      => $request->amount,
                'description' => $request->description ?? ($isPayment ? 'تسجيل دفع يدوي' : 'إضافة مبلغ يدوي'),
            ]);

            $absAmount = abs($request->amount);
            $label = $isPayment ? 'دفع' : 'إضافة مبلغ';

            session()->flash('success', "تم تسجيل {$label} بقيمة " . number_format($absAmount, 2) . " ج.م بنجاح");
        } catch (\Exception $e) {
            Log::error("Failed to add transaction for customer {$id}: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء تسجيل المعاملة');
        }

        return redirect()->route('customers.account', $id);
    }

    public function apiIndex(Request $request)
    {
        $search = $request->input('search');
        $query = User::where('role', 'customer')->with(['profile', 'orders']);
        
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhereHas('profile', function ($pq) use ($search) {
                      $pq->where('phone_number', 'like', '%' . $search . '%')
                        ->orWhere('shop_name', 'like', '%' . $search . '%')
                        ->orWhere('address', 'like', '%' . $search . '%');
                  });
            });
        }
        
        $paginator = $query->latest()->simplePaginate(15);
        $customers = collect($paginator->items())->map(function ($user) {
            $hasPassword = !empty($user->password);
            $hasCoords   = $user->profile?->latitude !== null || $user->profile?->longitude !== null;
            $fromApp     = $hasPassword && $hasCoords;

            $aggregates = \App\Models\CustomerTransaction::where('user_id', $user->id)
                ->selectRaw('
                    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_debts,
                    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_payments
                ')->first();
            $balance = round(floatval($aggregates->total_debts ?? 0) - floatval($aggregates->total_payments ?? 0), 2);

            return [
                'id'                  => $user->id,
                'name'                => $user->name,
                'email'               => $user->email ?? '—',
                'phone'               => $user->profile?->phone_number ?? '—',
                'address'             => $user->profile?->address ?? '—',
                'latitude'            => $user->profile?->latitude,
                'longitude'           => $user->profile?->longitude,
                'shop_name'           => $user->profile?->shop_name ?? '—',
                'category_of_place'   => $user->profile?->category_of_place ?? '—',
                'orders_count'        => $user->orders->count(),
                'total_spent'         => number_format($user->orders->sum('total_price'), 2) . ' ج',
                'status'              => 'active',
                'joined'              => $user->created_at ? $user->created_at->translatedFormat('F Y') : '—',
                'registered_from_app' => $fromApp,
                'balance'             => $balance,
            ];
        });

        return response()->json([
            'customers' => [
                'data'         => $customers,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'filters' => ['search' => $search]
        ]);
    }

    public function apiStore(Request $request)
    {
        $request->validate([
            'name'              => 'required|string|max:255',
            'phone'             => 'nullable|string|max:30',
            'phone_number'      => 'nullable|string|max:30',
            'address'           => 'nullable|string|max:255',
            'shop_name'         => 'nullable|string|max:255',
            'category_of_place' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name'     => $request->name,
                'email'    => 'cust_' . time() . rand(100, 999) . '@pos.local',
                'password' => bcrypt('password'),
                'role'     => 'customer',
            ]);

            $phone = $request->phone_number ?: $request->phone;

            Profile::create([
                'user_id'           => $user->id,
                'phone_number'      => $phone,
                'address'           => $request->address,
                'shop_name'         => $request->shop_name,
                'category_of_place' => $request->category_of_place,
                'region_id'         => $request->region_id,
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'تم إضافة العميل بنجاح!', 'customer' => $user]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء إضافة العميل.'], 500);
        }
    }

    public function apiUpdate(Request $request, $id)
    {
        $user = User::where('role', 'customer')->findOrFail($id);

        $request->validate([
            'name'              => 'required|string|max:255',
            'phone'             => 'nullable|string|max:30',
            'phone_number'      => 'nullable|string|max:30',
            'address'           => 'nullable|string|max:255',
            'shop_name'         => 'nullable|string|max:255',
            'category_of_place' => 'nullable|string|max:255',
            'region_id'         => 'nullable|exists:regions,id',
        ]);

        DB::beginTransaction();
        try {
            $user->update(['name' => $request->name]);

            $phone = $request->phone_number ?: $request->phone;

            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'phone_number'      => $phone,
                    'address'           => $request->address,
                    'shop_name'         => $request->shop_name,
                    'category_of_place' => $request->category_of_place,
                    'region_id'         => $request->region_id,
                ]
            );

            DB::commit();
            return response()->json(['success' => true, 'message' => 'تم تحديث بيانات العميل بنجاح!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تحديث بيانات العميل.'], 500);
        }
    }

    public function apiDestroy($id)
    {
        $user = User::where('role', 'customer')->findOrFail($id);

        if ($user->orders()->exists()) {
            return response()->json(['success' => false, 'message' => 'لا يمكن حذف العميل لأنه مرتبط بطلبات مسجلة!'], 422);
        }

        try {
            $user->delete();
            return response()->json(['success' => true, 'message' => 'تم حذف العميل بنجاح!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حذف العميل.'], 500);
        }
    }

    public function apiCustomerOrders(Request $request, $id)
    {
        $user = User::with('profile')->findOrFail($id);

        $paginator = \App\Models\Order::with(['products', 'returns'])
            ->where('user_id', $id)
            ->latest()
            ->simplePaginate(15);

        $orders = collect($paginator->items())->map(function ($order) {
            $returnedMap = $order->returns->groupBy('product_id')->map(fn($r) => $r->sum('quantity'));
            return [
                'id'            => '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'raw_id'        => $order->id,
                'items'         => $order->products->count(),
                'total'         => number_format(floatval($order->total_price), 2) . ' ج.م',
                'discount'      => floatval($order->discount ?? 0),
                'net_total'     => number_format(max(0, floatval($order->total_price) - floatval($order->discount ?? 0)), 2) . ' ج.م',
                'return_status' => $order->return_status,
                'payment_type'  => $order->payment_type ?? 'كاش',
                'profit'        => floatval($order->profit ?? 0),
                'date'          => $order->created_at ? $order->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
                'products'      => $order->products->map(function ($product) use ($returnedMap) {
                    $orderedQty  = $product->pivot->quantity;
                    $returnedQty = $returnedMap->get($product->id, 0);
                    return [
                        'id'           => $product->id,
                        'name'         => $product->name,
                        'unit'         => $product->unit ?? '',
                        'quantity'     => $orderedQty,
                        'price'        => floatval($product->pivot->price),
                        'total_price'  => floatval($product->pivot->total_price),
                        'returned_qty' => $returnedQty,
                        'available_qty'=> max(0, $orderedQty - $returnedQty),
                    ];
                })->values()->toArray(),
                'returns'       => $order->returns->map(fn($r) => [
                    'product_name'  => $r->product?->name ?? '—',
                    'quantity'      => $r->quantity,
                    'refund_amount' => floatval($r->refund_amount),
                    'reason'        => $r->reason,
                    'date'          => $r->created_at?->format('d M Y'),
                ])->values()->toArray(),
            ];
        });

        $stats = $this->buildCustomerStats($id);

        return response()->json([
            'customer' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'phone'     => $user->profile?->phone_number ?? '—',
                'address'   => $user->profile?->address ?? '—',
                'shop_name' => $user->profile?->shop_name ?? '—',
            ],
            'orders' => [
                'data'         => $orders,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'stats' => $stats,
        ]);
    }

    public function apiCustomerStatsRange(Request $request, $id)
    {
        return $this->customerStatsRange($request, $id);
    }

    public function apiAccountsIndex(Request $request)
    {
        $search = $request->input('search');

        $balances = \App\Models\CustomerTransaction::selectRaw('user_id, SUM(amount) as balance')
            ->groupBy('user_id')
            ->get();

        $totalDebtsOnCustomers = 0;
        $totalDebtsForCustomers = 0;
        $customersWithDebt = 0;

        foreach ($balances as $b) {
            $bal = floatval($b->balance);
            if ($bal > 0) {
                $totalDebtsOnCustomers += $bal;
                $customersWithDebt++;
            } elseif ($bal < 0) {
                $totalDebtsForCustomers += abs($bal);
            }
        }

        $globalStats = [
            'total_customers'           => User::where('role', 'customer')->count(),
            'total_debts_on_customers'  => round($totalDebtsOnCustomers, 2),
            'total_debts_for_customers' => round($totalDebtsForCustomers, 2),
            'customers_with_debt'       => $customersWithDebt,
        ];

        $query = User::where('role', 'customer')
            ->select('users.*')
            ->with(['profile', 'transactions'])
            ->addSelect([
                'abs_balance' => \App\Models\CustomerTransaction::selectRaw('ABS(COALESCE(SUM(amount), 0))')
                    ->whereColumn('user_id', 'users.id')
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhereHas('profile', function ($pq) use ($search) {
                      $pq->where('phone_number', 'like', '%' . $search . '%')
                        ->orWhere('shop_name', 'like', '%' . $search . '%');
                  });
            });
        }

        $paginator = $query->orderByDesc('abs_balance')->latest('users.id')->simplePaginate(20);

        $customers = collect($paginator->items())->map(function ($user) {
            $balance = floatval($user->transactions->sum('amount'));
            return [
                'id'        => $user->id,
                'name'      => $user->name,
                'phone'     => $user->profile?->phone_number ?? '—',
                'shop_name' => $user->profile?->shop_name ?? '—',
                'address'   => $user->profile?->address ?? '—',
                'balance'   => round($balance, 2),
            ];
        });

        return response()->json([
            'customers' => [
                'data'         => $customers,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'globalStats' => $globalStats,
            'filters'     => ['search' => $search],
        ]);
    }

    public function apiAccountDetails(Request $request, $id)
    {
        $user = User::with('profile')->findOrFail($id);

        // Auto sync any customer order that does not have a corresponding CustomerTransaction entry
        $existingOrderIdsInTx = \App\Models\CustomerTransaction::where('user_id', $id)
            ->whereNotNull('order_id')
            ->pluck('order_id')
            ->toArray();

        $unlinkedOrders = \App\Models\Order::where('user_id', $id)
            ->whereNotIn('id', $existingOrderIdsInTx)
            ->where('payment_type', '!=', 'كاش')
            ->get();

        foreach ($unlinkedOrders as $ord) {
            $orderLabel = '#ORD-' . str_pad($ord->id, 4, '0', STR_PAD_LEFT);
            \App\Models\CustomerTransaction::create([
                'user_id'     => $id,
                'order_id'    => $ord->id,
                'amount'      => floatval($ord->total_price),
                'description' => "طلب {$orderLabel} بقيمة " . number_format($ord->total_price, 2) . ' ج.م',
                'created_at'  => $ord->created_at,
                'updated_at'  => $ord->updated_at,
            ]);
        }

        $paginator = $user->transactions()
            ->latest()
            ->simplePaginate(20);

        $transactions = collect($paginator->items())->map(function ($t) use ($id) {
            $prevBalance = \App\Models\CustomerTransaction::where('user_id', $id)
                ->where(function($q) use ($t) {
                    $q->where('created_at', '<', $t->created_at)
                      ->orWhere(function($sub) use ($t) {
                          $sub->where('created_at', '=', $t->created_at)
                              ->where('id', '<', $t->id);
                      });
                })
                ->sum('amount');

            $amount = floatval($t->amount);
            $newBalance = floatval($prevBalance) + $amount;

            return [
                'id'               => $t->id,
                'amount'           => round($amount, 2),
                'previous_balance' => round(floatval($prevBalance), 2),
                'new_balance'      => round(floatval($newBalance), 2),
                'description'      => $t->description ?? '',
                'order_id'         => $t->order_id,
                'date'             => $t->created_at ? $t->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
            ];
        });

        $aggregates = \App\Models\CustomerTransaction::where('user_id', $id)
            ->selectRaw('
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_debts,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_payments
            ')->first();

        $totalDebts    = floatval($aggregates->total_debts ?? 0);
        $totalPayments = floatval($aggregates->total_payments ?? 0);
        $balance       = $totalDebts - $totalPayments;

        return response()->json([
            'customer' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'phone'     => $user->profile?->phone_number ?? '—',
                'shop_name' => $user->profile?->shop_name ?? '—',
                'address'   => $user->profile?->address ?? '—',
            ],
            'transactions' => [
                'data'         => $transactions->values()->all(),
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'balance'       => round($balance, 2),
            'total_debts'   => round($totalDebts, 2),
            'total_payments'=> round($totalPayments, 2),
        ]);
    }

    public function apiAddTransaction(Request $request, $id)
    {
        $request->validate([
            'amount'      => 'required|numeric|not_in:0',
            'description' => 'nullable|string|max:500',
        ]);

        User::findOrFail($id);

        try {
            $isPayment = floatval($request->amount) < 0;

            \App\Models\CustomerTransaction::create([
                'user_id'     => $id,
                'order_id'    => null,
                'amount'      => $request->amount,
                'description' => $request->description ?? ($isPayment ? 'تسجيل دفع يدوي' : 'إضافة مبلغ يدوي'),
            ]);

            $absAmount = abs($request->amount);
            $label = $isPayment ? 'دفع' : 'إضافة مبلغ';

            return response()->json([
                'success' => true,
                'message' => "تم تسجيل {$label} بقيمة " . number_format($absAmount, 2) . " ج.م بنجاح",
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تسجيل المعاملة'], 500);
        }
    }
}
