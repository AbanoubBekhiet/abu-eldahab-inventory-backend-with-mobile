<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceivedOrderItem extends Model
{
    protected $fillable = [
        'received_order_id',
        'product_id',
        'quantity',
        'price',
        'total_price',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function receivedOrder()
    {
        return $this->belongsTo(ReceivedOrder::class);
    }
}
