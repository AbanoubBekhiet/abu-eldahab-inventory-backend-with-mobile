<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'contact_name',
        'phone',
        'address',
    ];

    public function receivedOrders()
    {
        return $this->hasMany(ReceivedOrder::class);
    }

    public function transactions()
    {
        return $this->hasMany(SupplierTransaction::class);
    }
}
