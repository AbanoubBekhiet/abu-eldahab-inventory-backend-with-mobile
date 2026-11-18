<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'body',
        'type',
        'data',
        'sent_by',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    public function reads()
    {
        return $this->hasMany(NotificationRead::class);
    }
}
