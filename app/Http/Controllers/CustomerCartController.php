<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CustomerCart;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class CustomerCartController extends Controller
{
    /**
     * Get the authenticated user's cart items formatted for the mobile app.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $cartItems = CustomerCart::with(['product.media', 'product.category', 'product.activeOffer'])
            ->where('user_id', $userId)
            ->get();

        $hasOfferCol = \Illuminate\Support\Facades\Schema::hasColumn('customer_carts', 'is_offer');
        $hasPriceCol = \Illuminate\Support\Facades\Schema::hasColumn('customer_carts', 'unit_price');

        $formattedCart = $cartItems->map(function ($cartItem) use ($hasOfferCol, $hasPriceCol) {
            $product = $cartItem->product;
            
            $media = $product ? $product->getFirstMedia('products') : null;
            $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;

            $isOffer = false;
            $itemPrice = $product ? floatval($product->price) : 0;
            $maxLimit = $product ? $product->max_app_order_quantity : null;

            if ($hasOfferCol && !empty($cartItem->is_offer)) {
                $offer = $product ? $product->activeOffer : null;
                if ($offer) {
                    $isOffer = true;
                    $itemPrice = $hasPriceCol && $cartItem->unit_price !== null 
                        ? floatval($cartItem->unit_price) 
                        : floatval($offer->offer_price);
                    $maxLimit = $offer->offer_max_quantity ?? ($product ? $product->max_app_order_quantity : null);
                }
            } elseif ($hasPriceCol && $cartItem->unit_price !== null) {
                $itemPrice = floatval($cartItem->unit_price);
            }

            return [
                'id'                     => $cartItem->id,
                'product_id'             => $cartItem->product_id,
                'name'                   => $product ? $product->name : '—',
                'price'                  => $itemPrice,
                'is_offer'               => $isOffer,
                'quantity'               => floatval($cartItem->quantity),
                'image_url'              => $imageUrl,
                'category_name'          => $product && $product->category ? $product->category->name : 'بدون قسم',
                'max_app_order_quantity' => $maxLimit,
            ];
        });

        return response()->json([
            'success' => true,
            'cart_items' => $formattedCart
        ]);
    }

    /**
     * Add a product to cart or increment its quantity.
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|integer|min:1',
            'is_offer'   => 'nullable|boolean',
            'unit_price' => 'nullable|numeric|min:0',
        ]);

        $userId = $request->user()->id;
        $productId = $request->product_id;
        $qtyToAdd = $request->quantity;
        $isOffer = $request->boolean('is_offer');

        $errorResponse = null;

        DB::transaction(function() use ($userId, $productId, $qtyToAdd, $isOffer, &$errorResponse) {
            $product = Product::where('id', $productId)->lockForUpdate()->firstOrFail();

            $cartItem = CustomerCart::firstOrNew([
                'user_id' => $userId,
                'product_id' => $productId
            ]);

            $newQuantity = $cartItem->exists ? $cartItem->quantity + $qtyToAdd : $qtyToAdd;

            if ($product->stock < $newQuantity) {
                $errorResponse = response()->json([
                    'success' => false,
                    'message' => "الكمية المطلوبة من المنتج '{$product->name}' غير متوفرة، المتاح فقط {$product->stock}"
                ], 422);
                return;
            }

            $cartItem->quantity = $newQuantity;

            // Determine if item was added as an offer
            $activeOffer = $product->activeOffer;
            $hasActiveOffer = $isOffer && $activeOffer !== null;

            if (\Illuminate\Support\Facades\Schema::hasColumn('customer_carts', 'is_offer')) {
                // If it's explicitly an offer, set true; if explicitly from search/regular, set false
                $cartItem->is_offer = $hasActiveOffer;
            }

            if (\Illuminate\Support\Facades\Schema::hasColumn('customer_carts', 'unit_price')) {
                $cartItem->unit_price = $hasActiveOffer ? floatval($activeOffer->offer_price) : floatval($product->price);
            }

            $cartItem->save();
        });

        if ($errorResponse) {
            return $errorResponse;
        }

        return $this->index($request);
    }

    /**
     * Update the exact quantity of a product in the cart (or add delta).
     */
    public function update(Request $request, $productId)
    {
        $request->validate([
            'delta' => 'required|integer'
        ]);

        $userId = $request->user()->id;
        $delta = $request->delta;

        $errorResponse = null;

        DB::transaction(function() use ($userId, $productId, $delta, &$errorResponse) {
            $product = Product::where('id', $productId)->lockForUpdate()->firstOrFail();

            $cartItem = CustomerCart::where('user_id', $userId)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if ($cartItem) {
                $newQuantity = $cartItem->quantity + $delta;

                if ($newQuantity > 0 && $product->stock < $newQuantity) {
                    $errorResponse = response()->json([
                        'success' => false,
                        'message' => "الكمية المطلوبة من المنتج '{$product->name}' غير متوفرة، المتاح فقط {$product->stock}"
                    ], 422);
                    return;
                }

                if ($newQuantity <= 0) {
                    $cartItem->delete();
                } else {
                    $cartItem->quantity = $newQuantity;
                    $cartItem->save();
                }
            }
        });

        if ($errorResponse) {
            return $errorResponse;
        }

        return $this->index($request);
    }

    /**
     * Remove a specific product from the cart completely.
     */
    public function destroy(Request $request, $productId)
    {
        $userId = $request->user()->id;

        CustomerCart::where('user_id', $userId)
            ->where('product_id', $productId)
            ->delete();

        return $this->index($request);
    }

    /**
     * Clear the user's entire cart.
     */
    public function clear(Request $request)
    {
        $userId = $request->user()->id;

        CustomerCart::where('user_id', $userId)->delete();

        return response()->json([
            'success' => true,
            'cart_items' => []
        ]);
    }
}
