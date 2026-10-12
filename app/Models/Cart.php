<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Product;
class Cart extends Model
{
    //
    protected $fillable = [
        'user_id',
        'customer_id',
        'product_id',
        'quantity',
        'price',
        'total_price',
    ];

    protected $casts = [
        'quantity'    => 'float',
        'price'       => 'float',
        'total_price' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
