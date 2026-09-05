<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use Inertia\Inertia;
use App\Imports\SimpleArrayImport;
use Maatwebsite\Excel\Facades\Excel;

class ProductsController extends Controller
{
    public function index(Request $request){
        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        
        $query = Product::with(['category', 'media']);
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
            });
        }
        
        if ($categoryId && $categoryId !== 'all' && $categoryId !== 'الكل') {
            if (is_numeric($categoryId)) {
                $query->where('category_id', $categoryId);
            } else {
                $query->whereHas('category', function($q) use ($categoryId) {
                    $q->where('name', $categoryId);
                });
            }
        }
        
        $paginator = $query->latest()->simplePaginate(18);
        
        $products = collect($paginator->items())->map(function($product) {
            $media = $product->getFirstMedia('products');
            $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;
            return [
                'id'                      => $product->id,
                'name'                    => $product->name,
                'price'                   => floatval($product->price),
                'cost_price'              => floatval($product->cost_price),
                'description'             => $product->description,
                'is_available_on_app'     => (bool) $product->is_available_on_app,
                'max_app_order_quantity'  => $product->max_app_order_quantity !== null ? intval($product->max_app_order_quantity) : null,
                'stock'                   => intval($product->stock),
                'unit'                    => $product->unit,
                'number_of_items_in_unit' => intval($product->number_of_items_in_unit),
                'category_id'             => $product->category_id,
                'category_name'           => $product->category ? $product->category->name : 'بدون قسم',
                'image_url'               => $imageUrl,
            ];
        });
        
        $categories = Category::all(['id', 'name']);
        
        return Inertia::render('products/Index', [
            'products' => [
                'data'         => $products,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'total_count' => Product::count(),
            'categories'  => $categories,
            'filters'     => [
                'search'      => $search,
                'category_id' => $categoryId
            ]
        ]);
    }

    public function store(Request $request){
        $request->validate([
            'name'                   => 'required|string|max:255',
            'price'                  => 'required|numeric|min:0',
            'cost_price'             => 'nullable|numeric|min:0',
            'stock'                  => 'required|integer|min:0',
            'unit'                   => 'required|in:شكارة,علبة,كرتونة,شريط,دستة,لفة,قطعة',
            'number_of_items_in_unit'=> 'required|integer|min:1',
            'category_id'            => 'required|exists:categories,id',
            'description'            => 'nullable|string',
            'image'                  => 'nullable',
        ]);
        if($request->cost_price == 0){
            session()->flash('error', 'سعر التكلفة يجب أن يكون أكبر من 0!');
            return redirect()->back();
        }
        $product = Product::create([
            'name'                   => $request->name,
            'price'                  => $request->price,
            'cost_price'             => $request->cost_price ?? 0,
            'stock'                  => $request->stock,
            'unit'                   => $request->unit,
            'number_of_items_in_unit'=> $request->number_of_items_in_unit,
            'category_id'            => $request->category_id,
            'description'            => $request->description,
        ]);
        
        if ($request->hasFile('image')) {
            $product->addMediaFromRequest('image')->toMediaCollection('products');
        }
        
        session()->flash('success', 'تم إضافة المنتج بنجاح!');
        return redirect()->route('products');
    }

    public function update(Request $request, $id){
        $request->validate([
            'name'                   => 'required|string|max:255',
            'price'                  => 'required|numeric|min:0',
            'cost_price'             => 'nullable|numeric|min:0',
            'stock'                  => 'required|integer|min:0',
            'unit'                   => 'required|in:شكارة,علبة,كرتونة,شريط,دستة,لفة,قطعة',
            'number_of_items_in_unit'=> 'required|integer|min:1',
            'category_id'            => 'required|exists:categories,id',
            'description'            => 'nullable|string',
            'image'                  => 'nullable',
        ]);
        
        $product = Product::findOrFail($id);
        $product->update([
            'name'                   => $request->name,
            'price'                  => $request->price,
            'cost_price'             => $request->cost_price ?? 0,
            'stock'                  => $request->stock,
            'unit'                   => $request->unit,
            'number_of_items_in_unit'=> $request->number_of_items_in_unit,
            'category_id'            => $request->category_id,
            'description'            => $request->description,
        ]);
        
        if ($request->hasFile('image')) {
            $product->clearMediaCollection('products');
            $product->addMediaFromRequest('image')->toMediaCollection('products');
        }
        
        session()->flash('success', 'تم تحديث المنتج بنجاح!');
        return redirect()->route('products');
    }

    public function destroy($id){
        $product = Product::findOrFail($id);

        // Block deletion if the product exists in any sales order
        $inOrders = \Illuminate\Support\Facades\DB::table('products_orders')
            ->where('product_id', $id)->exists();
        if ($inOrders) {
            session()->flash('error', 'لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات مبيعات مسجلة!');
            return redirect()->route('products');
        }

        // Block deletion if the product exists in any supplier received order
        $inReceivedOrders = \Illuminate\Support\Facades\DB::table('received_order_items')
            ->where('product_id', $id)->exists();
        if ($inReceivedOrders) {
            session()->flash('error', 'لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات استلام من موردين!');
            return redirect()->route('products');
        }

        try {
            $product->clearMediaCollection('products');
            $product->delete();
            session()->flash('success', 'تم حذف المنتج بنجاح!');
        } catch (\Exception $e) {
            \Log::error("Failed to delete product {$id}: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء حذف المنتج: ' . $e->getMessage());
        }
        return redirect()->route('products');
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
            set_time_limit(0);
            $import = new SimpleArrayImport();
            Excel::import($import, $file);
            $rows = $import->getData();
            if (empty($rows)) {
                session()->flash('error', 'الملف فارغ أو غير صالح!');
                return redirect()->back();
            }

            $header = array_shift($rows);
            $header = array_map(function($h) {
                return trim(preg_replace('/[\x00-\x1F\x7F-\x9F\xEF\xBB\xBF]/', '', $h ?? ''));
            }, $header);

            $map = [];
            foreach ($header as $index => $col) {
                $colLower = strtolower($col);
                if ($colLower === 'name' || $col === 'الاسم' || $col === 'اسم المنتج') {
                    $map['name'] = $index;
                } elseif ($colLower === 'price' || $col === 'السعر' || $col === 'سعر البيع') {
                    $map['price'] = $index;
                } elseif ($colLower === 'cost_price' || $col === 'سعر التكلفة' || $col === 'تكلفة' || $col === 'سعر الشراء') {
                    $map['cost_price'] = $index;
                } elseif ($colLower === 'category' || $col === 'التصنيف' || $col === 'القسم') {
                    $map['category'] = $index;
                } elseif ($colLower === 'stock' || $col === 'المخزون' || $col === 'الكمية') {
                    $map['stock'] = $index;
                } elseif ($colLower === 'unit' || $col === 'الوحدة') {
                    $map['unit'] = $index;
                } elseif ($colLower === 'number_of_items_in_unit' || $colLower === 'items_in_unit' || $col === 'القطع داخل الوحدة' || $col === 'عدد القطع') {
                    $map['number_of_items_in_unit'] = $index;
                } elseif ($colLower === 'description' || $col === 'الوصف' || $col === 'تفاصيل') {
                    $map['description'] = $index;
                }
            }

            if (!isset($map['name']) || !isset($map['price']) || !isset($map['category'])) {
                session()->flash('error', 'تنسيق الملف غير صحيح! يجب أن يحتوي الملف على الأعمدة المطلوبة: "name", "price", "category" (أو بالعربية: "الاسم"، "السعر"، "التصنيف").');
                return redirect()->back();
            }

            $imported = 0;
            $skipped  = 0;
            $validUnits = ['شكارة', 'علبة', 'كرتونة', 'شريط', 'دستة', 'لفة', 'قطعة'];

            \Illuminate\Support\Facades\DB::beginTransaction();
            foreach ($rows as $row) {
                if (empty($row) || !isset($row[$map['name']]) || !isset($row[$map['price']]) || !isset($row[$map['category']])) {
                    $skipped++;
                    continue;
                }

                $name         = trim($row[$map['name']] ?? '');
                $priceInput   = trim($row[$map['price']] ?? '');
                $price        = floatval($priceInput);
                $categoryName = trim($row[$map['category']] ?? '');

                if (!$name || !$priceInput || !$categoryName) {
                    $skipped++;
                    continue;
                }

                $costPrice      = isset($map['cost_price']) && isset($row[$map['cost_price']]) ? floatval(trim($row[$map['cost_price']] ?? '0')) : 0;
                $stock          = isset($map['stock']) && isset($row[$map['stock']]) ? intval(trim($row[$map['stock']] ?? '0')) : 0;
                $unit           = isset($map['unit']) && isset($row[$map['unit']]) ? trim($row[$map['unit']] ?? '') : 'علبة';
                if (!in_array($unit, $validUnits)) { $unit = 'علبة'; }
                $numberOfItems  = isset($map['number_of_items_in_unit']) && isset($row[$map['number_of_items_in_unit']]) ? intval(trim($row[$map['number_of_items_in_unit']] ?? '1')) : 1;
                $description    = isset($map['description']) && isset($row[$map['description']]) ? trim($row[$map['description']] ?? '') : null;

                $category = Category::firstOrCreate(['name' => $categoryName]);

                Product::create([
                    'name'                   => $name,
                    'price'                  => $price,
                    'cost_price'             => $costPrice,
                    'stock'                  => $stock,
                    'unit'                   => $unit,
                    'number_of_items_in_unit'=> $numberOfItems,
                    'category_id'            => $category->id,
                    'description'            => $description,
                ]);

                $imported++;
            }
            \Illuminate\Support\Facades\DB::commit();
            session()->flash('success', "تم استيراد {$imported} منتج بنجاح! تم تخطي {$skipped} منتجات بسبب بيانات غير مكتملة.");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Log::error("Failed to import products: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء استيراد المنتجات: ' . $e->getMessage());
        }

        return redirect()->route('products');
    }

    public function apiIndex(Request $request)
    {
        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $forApp = $request->boolean('for_app');

        $query = Product::with(['category', 'media', 'activeOffer']);

        if ($forApp || ($request->user() && $request->user()->isCustomer())) {
            $query->where('is_available_on_app', 1);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        if ($categoryId && $categoryId !== 'all' && $categoryId !== 'الكل') {
            if (is_numeric($categoryId)) {
                $query->where('category_id', $categoryId);
            } else {
                $query->whereHas('category', function($q) use ($categoryId) {
                    $q->where('name', $categoryId);
                });
            }
        }

        if ($request->has('ids')) {
            $rawIds = $request->input('ids');
            $ids = is_array($rawIds) ? $rawIds : explode(',', $rawIds);
            $query->whereIn('id', array_filter(array_map('intval', $ids)));
        }

        if ($request->boolean('all') || $request->has('ids')) {
            $itemsList = $query->latest()->get();
            $products = collect($itemsList)->map(function ($product) {
                $media = $product->getFirstMedia('products');
                $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;
                $activeOffer = $product->activeOffer;
                return [
                    'id'                      => $product->id,
                    'name'                    => $product->name,
                    'price'                   => floatval($product->price),
                    'cost_price'              => floatval($product->cost_price),
                    'description'             => $product->description,
                    'is_available_on_app'     => (bool) $product->is_available_on_app,
                    'max_app_order_quantity'  => $product->max_app_order_quantity !== null ? intval($product->max_app_order_quantity) : null,
                    'stock'                   => intval($product->stock),
                    'unit'                    => $product->unit,
                    'number_of_items_in_unit' => intval($product->number_of_items_in_unit),
                    'category_id'             => $product->category_id,
                    'category_name'           => $product->category ? $product->category->name : 'بدون قسم',
                    'image_url'               => $imageUrl,
                    'active_offer'            => $activeOffer ? [
                        'id'                  => $activeOffer->id,
                        'offer_price'         => floatval($activeOffer->offer_price),
                        'original_price'      => floatval($activeOffer->original_price),
                        'discount_percentage' => $activeOffer->original_price > 0 ? round((1 - $activeOffer->offer_price / $activeOffer->original_price) * 100) : 0,
                        'expires_at'          => $activeOffer->expires_at->toIso8601String(),
                        'offer_max_quantity'  => $activeOffer->offer_max_quantity,
                    ] : null,
                ];
            });

            return response()->json([
                'products' => [
                    'data'         => $products,
                    'next_page'    => null,
                    'current_page' => 1,
                ],
                'total_count' => Product::count(),
                'categories'  => Category::all(['id', 'name']),
                'filters'     => ['search' => $search, 'category_id' => $categoryId]
            ]);
        }

        $paginator = $query->latest()->simplePaginate(18);

        $products = collect($paginator->items())->map(function($product) {
            $media = $product->getFirstMedia('products');
            $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;
            $activeOffer = $product->activeOffer;
            return [
                'id'                      => $product->id,
                'name'                    => $product->name,
                'price'                   => floatval($product->price),
                'cost_price'              => floatval($product->cost_price),
                'description'             => $product->description,
                'is_available_on_app'     => (bool) $product->is_available_on_app,
                'max_app_order_quantity'  => $product->max_app_order_quantity !== null ? intval($product->max_app_order_quantity) : null,
                'stock'                   => intval($product->stock),
                'unit'                    => $product->unit,
                'number_of_items_in_unit' => intval($product->number_of_items_in_unit),
                'category_id'             => $product->category_id,
                'category_name'           => $product->category ? $product->category->name : 'بدون قسم',
                'image_url'               => $imageUrl,
                'active_offer'            => $activeOffer ? [
                    'id'                  => $activeOffer->id,
                    'offer_price'         => floatval($activeOffer->offer_price),
                    'original_price'      => floatval($activeOffer->original_price),
                    'discount_percentage' => $activeOffer->original_price > 0 ? round((1 - $activeOffer->offer_price / $activeOffer->original_price) * 100) : 0,
                    'expires_at'          => $activeOffer->expires_at->toIso8601String(),
                    'offer_max_quantity'  => $activeOffer->offer_max_quantity,
                ] : null,
            ];
        });

        $categories = Category::all(['id', 'name']);

        return response()->json([
            'products' => [
                'data'         => $products,
                'next_page'    => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
                'current_page' => $paginator->currentPage(),
            ],
            'total_count' => Product::count(),
            'categories'  => $categories,
            'filters'     => [
                'search'      => $search,
                'category_id' => $categoryId
            ]
        ]);
    }

    public function apiFilter(Request $request)
    {
        return $this->apiIndex($request);
    }

    public function apiStore(Request $request)
    {
        $request->validate([
            'name'                   => 'required|string|max:255',
            'price'                  => 'required|numeric|min:0',
            'cost_price'             => 'nullable|numeric|min:0',
            'stock'                  => 'required|integer|min:0',
            'unit'                   => 'required|string|max:50',
            'number_of_items_in_unit'=> 'required|integer|min:1',
            'category_id'            => 'required|exists:categories,id',
            'description'            => 'nullable|string',
            'is_available_on_app'    => 'nullable',
            'max_app_order_quantity' => 'nullable|integer|min:1',
            'image'                  => 'nullable',
        ]);

        if ($request->cost_price == 0) {
            return response()->json([
                'success' => false,
                'message' => 'سعر التكلفة يجب أن يكون أكبر من 0!'
            ], 422);
        }

        $product = Product::create([
            'name'                   => $request->name,
            'price'                  => $request->price,
            'cost_price'             => $request->cost_price ?? 0,
            'stock'                  => $request->stock,
            'unit'                   => $request->unit,
            'number_of_items_in_unit'=> $request->number_of_items_in_unit,
            'category_id'            => $request->category_id,
            'description'            => $request->description,
            'is_available_on_app'    => $request->boolean('is_available_on_app', true),
            'max_app_order_quantity' => $request->filled('max_app_order_quantity') ? intval($request->max_app_order_quantity) : null,
        ]);

        if ($request->hasFile('image')) {
            $product->addMediaFromRequest('image')->toMediaCollection('products');
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة المنتج بنجاح!',
            'product' => $product,
        ]);
    }

    public function apiUpdate(Request $request, $id)
    {
        $request->validate([
            'name'                   => 'sometimes|required|string|max:255',
            'price'                  => 'sometimes|required|numeric|min:0',
            'cost_price'             => 'nullable|numeric|min:0',
            'stock'                  => 'nullable|integer|min:0',
            'unit'                   => 'nullable|string|max:50',
            'number_of_items_in_unit'=> 'nullable|integer|min:1',
            'category_id'            => 'nullable|exists:categories,id',
            'description'            => 'nullable|string',
            'is_available_on_app'    => 'nullable',
            'max_app_order_quantity' => 'nullable|integer|min:1',
            'image'                  => 'nullable',
        ]);

        $product = Product::findOrFail($id);

        $fields = [];
        if ($request->has('price')) {
            $fields['price'] = floatval($request->price);
        }
        if ($request->has('is_available_on_app')) {
            $fields['is_available_on_app'] = $request->boolean('is_available_on_app');
        }
        if ($request->has('name')) {
            $fields['name'] = $request->name;
        }
        if ($request->has('cost_price')) {
            $fields['cost_price'] = $request->cost_price;
        }
        if ($request->has('stock')) {
            $fields['stock'] = $request->stock;
        }
        if ($request->has('unit')) {
            $fields['unit'] = $request->unit;
        }
        if ($request->has('category_id')) {
            $fields['category_id'] = $request->category_id;
        }

        if (!empty($fields)) {
            $product->update($fields);
        }

        if ($request->hasFile('image')) {
            $product->clearMediaCollection('products');
            $product->addMediaFromRequest('image')->toMediaCollection('products');
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث المنتج بنجاح!',
            'product' => $product,
        ]);
    }

    public function apiDestroy($id)
    {
        $product = Product::findOrFail($id);

        $inOrders = \Illuminate\Support\Facades\DB::table('products_orders')
            ->where('product_id', $id)->exists();
        if ($inOrders) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات مبيعات مسجلة!'
            ], 422);
        }

        $inReceivedOrders = \Illuminate\Support\Facades\DB::table('received_order_items')
            ->where('product_id', $id)->exists();
        if ($inReceivedOrders) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات استلام من موردين!'
            ], 422);
        }

        try {
            $product->clearMediaCollection('products');
            $product->delete();
            return response()->json([
                'success' => true,
                'message' => 'تم حذف المنتج بنجاح!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حذف المنتج: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function apiImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
        ]);

        $file = $request->file('file');
        $ext  = strtolower($file->getClientOriginalExtension());

        if (!in_array($ext, ['csv', 'xlsx', 'xls', 'txt'])) {
            return response()->json([
                'success' => false,
                'message' => 'امتداد الملف غير مدعوم. يرجى رفع ملف CSV أو Excel (xlsx/xls).'
            ], 422);
        }

        try {
            set_time_limit(0);
            $import = new SimpleArrayImport();
            Excel::import($import, $file);
            $rows = $import->getData();
            if (empty($rows)) {
                return response()->json(['success' => false, 'message' => 'الملف فارغ أو غير صالح!'], 422);
            }

            $header = array_shift($rows);
            $header = array_map(function($h) {
                return trim(preg_replace('/[\x00-\x1F\x7F-\x9F\xEF\xBB\xBF]/', '', $h ?? ''));
            }, $header);

            $map = [];
            foreach ($header as $index => $col) {
                $colLower = strtolower($col);
                if ($colLower === 'name' || $col === 'الاسم' || $col === 'اسم المنتج') {
                    $map['name'] = $index;
                } elseif ($colLower === 'price' || $col === 'السعر' || $col === 'سعر البيع') {
                    $map['price'] = $index;
                } elseif ($colLower === 'cost_price' || $col === 'سعر التكلفة' || $col === 'تكلفة' || $col === 'سعر الشراء') {
                    $map['cost_price'] = $index;
                } elseif ($colLower === 'category' || $col === 'التصنيف' || $col === 'القسم') {
                    $map['category'] = $index;
                } elseif ($colLower === 'stock' || $col === 'المخزون' || $col === 'الكمية') {
                    $map['stock'] = $index;
                } elseif ($colLower === 'unit' || $col === 'الوحدة') {
                    $map['unit'] = $index;
                } elseif ($colLower === 'number_of_items_in_unit' || $colLower === 'items_in_unit' || $col === 'القطع داخل الوحدة' || $col === 'عدد القطع') {
                    $map['number_of_items_in_unit'] = $index;
                } elseif ($colLower === 'description' || $col === 'الوصف' || $col === 'تفاصيل') {
                    $map['description'] = $index;
                }
            }

            if (!isset($map['name']) || !isset($map['price']) || !isset($map['category'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'تنسيق الملف غير صحيح! يجب أن يحتوي الملف على الأعمدة المطلوبة: "name", "price", "category".'
                ], 422);
            }

            $imported = 0;
            $skipped  = 0;
            $validUnits = ['شكارة', 'علبة', 'كرتونة', 'شريط', 'دستة', 'لفة', 'قطعة'];

            \Illuminate\Support\Facades\DB::beginTransaction();
            foreach ($rows as $row) {
                if (empty($row) || !isset($row[$map['name']]) || !isset($row[$map['price']]) || !isset($row[$map['category']])) {
                    $skipped++;
                    continue;
                }

                $name         = trim($row[$map['name']] ?? '');
                $priceInput   = trim($row[$map['price']] ?? '');
                $price        = floatval($priceInput);
                $categoryName = trim($row[$map['category']] ?? '');

                if (!$name || !$priceInput || !$categoryName) {
                    $skipped++;
                    continue;
                }

                $costPrice      = isset($map['cost_price']) && isset($row[$map['cost_price']]) ? floatval(trim($row[$map['cost_price']] ?? '0')) : 0;
                $stock          = isset($map['stock']) && isset($row[$map['stock']]) ? intval(trim($row[$map['stock']] ?? '0')) : 0;
                $unit           = isset($map['unit']) && isset($row[$map['unit']]) ? trim($row[$map['unit']] ?? '') : 'علبة';
                if (!in_array($unit, $validUnits)) { $unit = 'علبة'; }
                $numberOfItems  = isset($map['number_of_items_in_unit']) && isset($row[$map['number_of_items_in_unit']]) ? intval(trim($row[$map['number_of_items_in_unit']] ?? '1')) : 1;
                $description    = isset($map['description']) && isset($row[$map['description']]) ? trim($row[$map['description']] ?? '') : null;

                $category = Category::firstOrCreate(['name' => $categoryName]);

                Product::create([
                    'name'                   => $name,
                    'price'                  => $price,
                    'cost_price'             => $costPrice,
                    'stock'                  => $stock,
                    'unit'                   => $unit,
                    'number_of_items_in_unit'=> $numberOfItems,
                    'category_id'            => $category->id,
                    'description'            => $description,
                ]);

                $imported++;
            }
            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => "تم استيراد {$imported} منتج بنجاح! تم تخطي {$skipped} منتجات بسبب بيانات غير مكتملة."
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء استيراد المنتجات: ' . $e->getMessage()
            ], 500);
        }
    }
}
