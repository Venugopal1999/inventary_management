<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'email',
        'phone',
        'contact_json',
        'payment_terms',
        'credit_limit',
        'currency',
        'tax_id',
        'rating',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'contact_json' => 'array',
        'credit_limit' => 'decimal:2',
        'rating' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get all purchase orders for this supplier
     */
    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    /**
     * Get active purchase orders
     */
    public function activePurchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class)
            ->whereIn('status', ['submitted', 'approved', 'ordered', 'partial']);
    }

    /**
     * Scope to filter active suppliers only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to search by name or code
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('code', 'like', "%{$term}%")
              ->orWhere('email', 'like', "%{$term}%");
        });
    }

    /**
     * Get formatted contact address
     */
    public function getFormattedAddressAttribute(): ?string
    {
        if (!$this->contact_json) {
            return null;
        }

        $contact = $this->contact_json;
        $parts = array_filter([
            $contact['address_line1'] ?? null,
            $contact['address_line2'] ?? null,
            $contact['city'] ?? null,
            $contact['state'] ?? null,
            $contact['postal_code'] ?? null,
            $contact['country'] ?? null,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Get primary contact name
     */
    public function getPrimaryContactAttribute(): ?string
    {
        return $this->contact_json['primary_contact'] ?? null;
    }

    /**
     * Get total value of active purchase orders
     */
    public function getActivePurchaseOrdersValueAttribute(): float
    {
        return $this->activePurchaseOrders()
            ->sum('total_amount');
    }

    /**
     * Check if supplier has reached credit limit
     */
    public function hasCreditAvailable(float $amount = 0): bool
    {
        if (!$this->credit_limit) {
            return true; // No credit limit set
        }

        $currentOutstanding = $this->getActivePurchaseOrdersValueAttribute();
        return ($currentOutstanding + $amount) <= $this->credit_limit;
    }

    /**
     * Generate next supplier code
     */
    public static function generateCode(): string
    {
        $lastSupplier = static::withTrashed()
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $lastSupplier ? $lastSupplier->id + 1 : 1;
        return 'SUP-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }
}
