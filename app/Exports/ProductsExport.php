<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ProductsExport implements FromView, ShouldAutoSize
{
    protected $categoryIds;
    protected $stockFilter;
    protected $appFilter;
    protected $columns;

    public function __construct($categoryIds = [], $stockFilter = null, $appFilter = null, $columns = [])
    {
        $this->categoryIds = $categoryIds;
        $this->stockFilter = $stockFilter;
        $this->appFilter = $appFilter;
        $this->columns = $columns;
    }

    public function view(): View
    {
        $query = Product::with('category')->orderBy('id', 'asc');
        
        if (!empty($this->categoryIds) && $this->categoryIds[0] !== 'all') {
            $validCategoryIds = array_filter($this->categoryIds, fn($id) => $id !== 'all' && is_numeric($id));
            if (!empty($validCategoryIds)) {
                $query->whereIn('category_id', $validCategoryIds);
            }
        }

        if ($this->stockFilter === 'out_of_stock') {
            $query->where('stock', '<=', 0);
        } elseif ($this->stockFilter === 'in_stock') {
            $query->where('stock', '>', 0);
        }

        if ($this->appFilter === 'hidden' || $this->appFilter === 'unavailable') {
            $query->where(function($q) {
                $q->where('is_available_on_app', false)->orWhereNull('is_available_on_app');
            });
        } elseif ($this->appFilter === 'visible' || $this->appFilter === 'available') {
            $query->where('is_available_on_app', true);
        }

        return view('print.products-excel', [
            'products' => $query->get(),
            'columns'  => $this->columns,
        ]);
    }
}
