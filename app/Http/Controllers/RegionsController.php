<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Region;

class RegionsController extends Controller
{
    /**
     * API: Get all regions
     */
    public function apiIndex()
    {
        $regions = Region::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $regions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function apiStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name',
            'min_order_total' => 'required|numeric|min:0',
            'min_products_count' => 'required|integer|min:1',
        ]);

        $region = Region::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة المنطقة بنجاح',
            'data' => $region
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function apiUpdate(Request $request, Region $region)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name,' . $region->id,
            'min_order_total' => 'required|numeric|min:0',
            'min_products_count' => 'required|integer|min:1',
        ]);

        $region->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تعديل المنطقة بنجاح',
            'data' => $region
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function apiDestroy(Region $region)
    {
        if ($region->profiles()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف المنطقة لارتباطها بعملاء'
            ], 400);
        }
        $region->delete();
        return response()->json([
            'success' => true,
            'message' => 'تم حذف المنطقة بنجاح'
        ]);
    }
}
