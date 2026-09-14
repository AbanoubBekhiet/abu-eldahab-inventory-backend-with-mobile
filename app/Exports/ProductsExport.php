<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ProductsExport implements FromView, ShouldAutoSize
{
    protected $categoryIds;

    public function __construct($categoryIds)
    {
        $this->categoryIds = $categoryIds;
    }

    public function view(): View
    {
        $query = Product::with('category')->orderBy('category_id')->orderBy('name');
        
        if (!empty($this->categoryIds) && $this->categoryIds[0] !== 'all') {
            $query->whereIn('category_id', $this->categoryIds);
        }

        return view('print.products-excel', [
            'products' => $query->get()
        ]);
    }
}
