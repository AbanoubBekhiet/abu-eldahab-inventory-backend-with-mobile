<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CustomerCart;
use App\Models\Product;

class CustomerCartController extends Controller
{
    /**
     * Get the authenticated user's cart items formatted for the mobile app.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $cartItems = CustomerCart::with(['product.media', 'product.category'])
            ->where('user_id', $userId)
            ->get();

        $formattedCart = $cartItems->map(function ($cartItem) {
            $product = $cartItem->product;
            
            $media = $product ? $product->getFirstMedia('products') : null;
            $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;

            return [
                'id' => $cartItem->id, // Cart item ID (or product ID, but front uses ID for list keys sometimes)
                'product_id' => $cartItem->product_id,
                'name' => $product ? $product->name : '—',
                'price' => $product ? floatval($product->price) : 0,
                'quantity' => intval($cartItem->quantity),
                'image_url' => $imageUrl,
                'category_name' => $product && $product->category ? $product->category->name : 'بدون قسم',
                'max_app_order_quantity' => $product ? $product->max_app_order_quantity : null,
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
            'quantity' => 'required|integer|min:1'
        ]);

        $userId = $request->user()->id;
        $productId = $request->product_id;
        $qtyToAdd = $request->quantity;

        $cartItem = CustomerCart::firstOrNew([
            'user_id' => $userId,
            'product_id' => $productId
        ]);

        if ($cartItem->exists) {
            $cartItem->quantity += $qtyToAdd;
        } else {
            $cartItem->quantity = $qtyToAdd;
        }

        $cartItem->save();

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

        $cartItem = CustomerCart::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($cartItem) {
            $newQuantity = $cartItem->quantity + $delta;
            if ($newQuantity <= 0) {
                $cartItem->delete();
            } else {
                $cartItem->quantity = $newQuantity;
                $cartItem->save();
            }
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
