<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierTransaction extends Model
{
    protected $fillable = [
        'supplier_id',
        'received_order_id',
        'amount',       // positive = debt I owe to supplier, negative = I paid them
        'description',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receivedOrder()
    {
        return $this->belongsTo(ReceivedOrder::class);
    }
}
