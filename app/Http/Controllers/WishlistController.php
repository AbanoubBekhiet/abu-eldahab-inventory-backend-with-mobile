<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Wishlist;

class WishlistController extends Controller
{
    /**
     * Get the authenticated user's favorite product IDs.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        
        $favoriteIds = Wishlist::where('user_id', $userId)
            ->pluck('product_id')
            ->toArray();

        return response()->json([
            'success' => true,
            'favorite_ids' => $favoriteIds
        ]);
    }

    /**
     * Toggle a product in the authenticated user's wishlist.
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id'
        ]);

        $userId = $request->user()->id;
        $productId = $request->product_id;

        $wishlist = Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($wishlist) {
            $wishlist->delete();
            $action = 'removed';
        } else {
            Wishlist::create([
                'user_id' => $userId,
                'product_id' => $productId
            ]);
            $action = 'added';
        }

        $favoriteIds = Wishlist::where('user_id', $userId)
            ->pluck('product_id')
            ->toArray();

        return response()->json([
            'success' => true,
            'action' => $action,
            'favorite_ids' => $favoriteIds
        ]);
    }
}
