<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Offer;
use App\Models\Product;
use App\Models\User;
use App\Services\FcmService;
use Inertia\Inertia;

class OffersController extends Controller
{
    /**
     * Web page: Inertia render for offers management
     */
    public function index()
    {
        return Inertia::render('offers/Index');
    }

    /**
     * API: Get all offers (admin view - includes expired)
     */
    public function apiIndex(Request $request)
    {
        $query = Offer::with(['product.media', 'product.category', 'creator'])
            ->latest();

        $paginator = $query->simplePaginate(20);

        $offers = collect($paginator->items())->map(function ($offer) {
            return $this->formatOffer($offer);
        });

        return response()->json([
            'offers' => [
                'data'      => $offers,
                'next_page' => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
            ],
        ]);
    }

    /**
     * API: Get active offers only (for customers)
     */
    public function apiActiveOffers(Request $request)
    {
        $offers = Offer::active()
            ->with(['product.media', 'product.category'])
            ->latest()
            ->get()
            ->map(function ($offer) {
                return $this->formatOffer($offer);
            });

        return response()->json([
            'offers' => $offers,
        ]);
    }

    /**
     * API: Create a new offer
     */
    public function apiStore(Request $request)
    {
        $request->validate([
            'product_id'        => 'required|exists:products,id',
            'offer_price'       => 'required|numeric|min:0',
            'offer_max_quantity' => 'nullable|integer|min:1',
            'expires_at'        => 'required|date|after:now',
        ]);

        $product = Product::findOrFail($request->product_id);

        // Deactivate any existing active offer for this product
        Offer::where('product_id', $product->id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        // Save original values
        $originalPrice = $product->price;
        $originalMaxQty = $product->max_app_order_quantity;

        // Create the offer
        $offer = Offer::create([
            'product_id'          => $product->id,
            'offer_price'         => $request->offer_price,
            'original_price'      => $originalPrice,
            'offer_max_quantity'   => $request->offer_max_quantity,
            'original_max_quantity' => $originalMaxQty,
            'expires_at'          => $request->expires_at,
            'is_active'           => true,
            'created_by'          => $request->user()->id,
        ]);

        // Update product price and limit
        $product->update([
            'price' => $request->offer_price,
            'max_app_order_quantity' => $request->offer_max_quantity ?? $product->max_app_order_quantity,
        ]);

        // Send FCM notification to all customers
        $this->notifyCustomersAboutOffer($product, $offer);

        $offer->load(['product.media', 'product.category', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة العرض بنجاح وتم إرسال إشعار للعملاء!',
            'offer'   => $this->formatOffer($offer),
        ]);
    }

    /**
     * API: Update an existing offer
     */
    public function apiUpdate(Request $request, $id)
    {
        $request->validate([
            'offer_price'        => 'sometimes|numeric|min:0',
            'offer_max_quantity'  => 'nullable|integer|min:1',
            'expires_at'         => 'sometimes|date|after:now',
        ]);

        $offer = Offer::findOrFail($id);
        $product = $offer->product;

        $updateData = [];
        if ($request->has('offer_price')) {
            $updateData['offer_price'] = $request->offer_price;
            $product->update(['price' => $request->offer_price]);
        }
        if ($request->has('offer_max_quantity')) {
            $updateData['offer_max_quantity'] = $request->offer_max_quantity;
            $product->update(['max_app_order_quantity' => $request->offer_max_quantity]);
        }
        if ($request->has('expires_at')) {
            $updateData['expires_at'] = $request->expires_at;
        }

        $offer->update($updateData);
        $offer->load(['product.media', 'product.category', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث العرض بنجاح!',
            'offer'   => $this->formatOffer($offer),
        ]);
    }

    /**
     * API: Delete/cancel an offer and restore original price + limit
     */
    public function apiDestroy($id)
    {
        $offer = Offer::findOrFail($id);
        $product = $offer->product;

        // Restore original price and max quantity
        if ($offer->is_active && !$offer->isExpired()) {
            $product->update([
                'price' => $offer->original_price,
                'max_app_order_quantity' => $offer->original_max_quantity,
            ]);
        }

        $offer->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء العرض واستعادة السعر الأصلي بنجاح!',
        ]);
    }

    // ── Private Helpers ──

    /**
     * Format offer data for API response
     */
    private function formatOffer(Offer $offer): array
    {
        $product = $offer->product;
        $media = $product ? $product->getFirstMedia('products') : null;
        $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;

        return [
            'id'                    => $offer->id,
            'product_id'            => $offer->product_id,
            'product_name'          => $product ? $product->name : '—',
            'product_image_url'     => $imageUrl,
            'category_name'         => $product && $product->category ? $product->category->name : 'بدون قسم',
            'offer_price'           => floatval($offer->offer_price),
            'original_price'        => floatval($offer->original_price),
            'offer_max_quantity'    => $offer->offer_max_quantity,
            'original_max_quantity' => $offer->original_max_quantity,
            'discount_percentage'   => $offer->original_price > 0
                ? round((1 - $offer->offer_price / $offer->original_price) * 100)
                : 0,
            'expires_at'            => $offer->expires_at->toIso8601String(),
            'is_active'             => $offer->is_active,
            'is_expired'            => $offer->isExpired(),
            'is_currently_active'   => $offer->isCurrentlyActive(),
            'created_by_name'       => $offer->creator ? $offer->creator->name : '—',
            'created_at'            => $offer->created_at->toIso8601String(),
            'product'               => $product ? [
                'id'                      => $product->id,
                'name'                    => $product->name,
                'price'                   => floatval($product->price),
                'stock'                   => intval($product->stock),
                'unit'                    => $product->unit,
                'number_of_items_in_unit' => intval($product->number_of_items_in_unit),
                'max_app_order_quantity'  => $product->max_app_order_quantity !== null ? intval($product->max_app_order_quantity) : null,
                'image_url'               => $imageUrl,
                'category_name'           => $product->category ? $product->category->name : 'بدون قسم',
            ] : null,
        ];
    }

    /**
     * Send push notification to all customers about a new offer
     */
    private function notifyCustomersAboutOffer(Product $product, Offer $offer): void
    {
        try {
            $customerTokens = User::where('role', 'customer')
                ->whereNotNull('fcm_token')
                ->where('fcm_token', '!=', '')
                ->pluck('fcm_token')
                ->toArray();

            if (empty($customerTokens)) {
                return;
            }

            $discountPct = $offer->original_price > 0
                ? round((1 - $offer->offer_price / $offer->original_price) * 100)
                : 0;

            $title = '🔥 عرض جديد من أبو الدهب!';
            $body  = "خصم {$discountPct}% على {$product->name} - السعر الجديد {$offer->offer_price} ج.م بدلاً من {$offer->original_price} ج.م";

            FcmService::sendToMultiple($customerTokens, $title, $body, [
                'type'       => 'new_offer',
                'offer_id'   => (string) $offer->id,
                'product_id' => (string) $product->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send offer notification: ' . $e->getMessage());
        }
    }
}
