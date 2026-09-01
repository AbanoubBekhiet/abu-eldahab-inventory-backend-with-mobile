<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingCartItem extends Model
{
    protected $fillable = [
        'pending_cart_id',
        'product_id',
        'quantity',
        'price',
        'total_price',
    ];

    protected $casts = [
        'price' => 'float',
        'total_price' => 'float',
        'quantity' => 'integer',
    ];

    public function pendingCart()
    {
        return $this->belongsTo(PendingCart::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
