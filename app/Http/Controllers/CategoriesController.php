<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use Inertia\Inertia;

class CategoriesController extends Controller
{
    public function index(Request $request){
        $search = $request->input('search');
        $query = Category::with('media');
        
        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }
        
        $categories = $query->get()->map(function($category) {
            $media = $category->getFirstMedia('categories');
            $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;
            return [
                'id' => $category->id,
                'name' => $category->name,
                'image_url' => $imageUrl,
                'products_count' => $category->products()->count(),
            ];
        });

        return Inertia::render('categories/Index', [
            'categories' => $categories,
            'filters' => ['search' => $search]
        ]);
    }

    public function update(Request $request, $id){
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable',
        ]);

        $category = Category::findOrFail($id);
        $category->update([
            'name' => $request->name,
        ]);

        if ($request->hasFile('image')) {
            $category->clearMediaCollection('categories');
            $category->addMediaFromRequest('image')->toMediaCollection('categories');
        }

        session()->flash('success', 'تم تحديث التصنيف بنجاح!');
        return redirect()->route('categories');
    }

    public function destroy($id){
        $category = Category::findOrFail($id);
        
        if ($category->products()->exists()) {
            session()->flash('error', 'لا يمكن حذف التصنيف لأنه يحتوي على منتجات!');
            return redirect()->route('categories');
        }   

        try {
            $category->clearMediaCollection('categories');
            $category->delete();
            session()->flash('success', 'تم حذف التصنيف بنجاح!');
        } catch (\Exception $e) {
            \Log::error("Failed to delete category {$id}: " . $e->getMessage());
            session()->flash('error', 'حدث خطأ أثناء حذف التصنيف: ' . $e->getMessage());
        }
        return redirect()->route('categories');
    }

    public function store(Request $request){
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable',
        ]);

        $category = Category::create([
            'name' => $request->name,
        ]);

        if ($request->hasFile('image')) {
            $category->addMediaFromRequest('image')->toMediaCollection('categories');
        }

        session()->flash('success', 'تم إضافة التصنيف بنجاح!');
        return redirect()->route('categories');
    }

    public function apiIndex(Request $request)
    {
        $search = $request->input('search');
        $query = Category::with('media');
        
        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }
        
        $categories = $query->get()->map(function($category) {
            $media = $category->getFirstMedia('categories');
            $imageUrl = $media ? route('app-storage.show', ['id' => $media->id, 'filename' => $media->file_name]) : null;
            return [
                'id' => $category->id,
                'name' => $category->name,
                'image_url' => $imageUrl,
                'products_count' => $category->products()->count(),
            ];
        });

        return response()->json([
            'categories' => $categories,
            'filters' => ['search' => $search]
        ]);
    }

    public function apiStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable',
        ]);

        $category = Category::create([
            'name' => $request->name,
        ]);

        if ($request->hasFile('image')) {
            $category->addMediaFromRequest('image')->toMediaCollection('categories');
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة التصنيف بنجاح!',
            'category' => $category,
        ]);
    }

    public function apiUpdate(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable',
        ]);

        $category = Category::findOrFail($id);
        $category->update([
            'name' => $request->name,
        ]);

        if ($request->hasFile('image')) {
            $category->clearMediaCollection('categories');
            $category->addMediaFromRequest('image')->toMediaCollection('categories');
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث التصنيف بنجاح!',
            'category' => $category,
        ]);
    }

    public function apiDestroy($id)
    {
        $category = Category::findOrFail($id);
        
        if ($category->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف التصنيف لأنه يحتوي على منتجات!',
            ], 422);
        }   

        try {
            $category->clearMediaCollection('categories');
            $category->delete();
            return response()->json([
                'success' => true,
                'message' => 'تم حذف التصنيف بنجاح!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حذف التصنيف: ' . $e->getMessage(),
            ], 500);
        }
    }
}
