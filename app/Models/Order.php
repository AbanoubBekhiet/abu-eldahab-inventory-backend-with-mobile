<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'total_price',
        'discount',
        'return_status',
        'status',
        'payment_type',
        'paid_amount',
        'profit',
        'previous_balance',
        'credit_used',
        'notes',
        'source',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Many-to-many via the products_orders pivot table.
     */
    public function products()
    {
        return $this->belongsToMany(Product::class, 'products_orders')
                    ->withPivot('quantity', 'price', 'total_price')
                    ->withTimestamps();
    }

    public function returns()
    {
        return $this->hasMany(OrderReturn::class);
    }

    public function transactions()
    {
        return $this->hasMany(CustomerTransaction::class);
    }
}
