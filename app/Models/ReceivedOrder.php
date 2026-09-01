<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceivedOrder extends Model
{
    protected $fillable = [
        'supplier_id',
        'total_price',
        'notes',
        'payment_type',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(ReceivedOrderItem::class);
    }
}
