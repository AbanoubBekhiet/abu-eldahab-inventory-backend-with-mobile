<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    protected $fillable = [
        'user_id',
        'phone_number',
        'address',
        'shop_name',
        'latitude',
        'longitude',
        'region_id',
    ];

    public function user(){
        return $this->belongsTo(User::class);
    }

    public function region()
    {
        return $this->belongsTo(Region::class);
    }
}
