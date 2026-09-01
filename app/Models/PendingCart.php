<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingCart extends Model
{
    protected $fillable = [
        'customer_id',
        'total',
        'items_count',
    ];

    protected $casts = [
        'total' => 'float',
        'items_count' => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function items()
    {
        return $this->hasMany(PendingCartItem::class);
    }
}
