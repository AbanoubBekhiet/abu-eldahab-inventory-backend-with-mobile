<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    protected $fillable = [
        'product_id',
        'offer_price',
        'original_price',
        'offer_max_quantity',
        'original_max_quantity',
        'expires_at',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'offer_price'          => 'decimal:2',
        'original_price'       => 'decimal:2',
        'offer_max_quantity'    => 'integer',
        'original_max_quantity' => 'integer',
        'expires_at'           => 'datetime',
        'is_active'            => 'boolean',
    ];

    // ── Relationships ──

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ──

    /**
     * Active offers: is_active = true AND expires_at > now
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where('expires_at', '>', now());
    }

    /**
     * Expired offers: expires_at <= now
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    // ── Helpers ──

    public function isExpired(): bool
    {
        return $this->expires_at <= now();
    }

    public function isCurrentlyActive(): bool
    {
        return $this->is_active && !$this->isExpired();
    }
}
