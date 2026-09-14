<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $fillable = ['name', 'min_order_total', 'min_products_count'];

    public function profiles()
    {
        return $this->hasMany(Profile::class);
    }
}
