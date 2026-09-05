<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Product extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'name',
        'price',
        'cost_price',
        'description',
        'is_available_on_app',
        'max_app_order_quantity',
        'stock',
        'unit',
        'number_of_items_in_unit',
        'category_id',
    ];

    protected $casts = [
        'is_available_on_app'    => 'boolean',
        'max_app_order_quantity' => 'integer',
        'price'                  => 'decimal:2',
        'cost_price'             => 'decimal:2',
    ];

    public function category(){
        return $this->belongsTo(Category::class);
    }
    
    public function order(){
        return $this->hasMany(Order::class);
    }

    public function offers(){
        return $this->hasMany(Offer::class);
    }

    public function activeOffer(){
        return $this->hasOne(Offer::class)
                    ->where('is_active', true)
                    ->where('expires_at', '>', now())
                    ->latest();
    }
}
