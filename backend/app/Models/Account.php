<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'account_name',
        'account_number',
        'account_type',
        'root_account_type',
        'parent_account_id',
        'description',
        'balance',
        'is_active',
        'is_group',
        'level',
        'full_code',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'is_active' => 'boolean',
        'is_group' => 'boolean',
        'level' => 'integer',
    ];

    protected $appends = [
        'has_children',
        'parent_name',
    ];

    /**
     * Get the parent account
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'parent_account_id');
    }

    /**
     * Get all child accounts
     */
    public function children(): HasMany
    {
        return $this->hasMany(Account::class, 'parent_account_id');
    }

    /**
     * Get all descendants (children, grandchildren, etc.)
     */
    public function descendants()
    {
        return $this->children()->with('descendants');
    }

    /**
     * Get all ancestors (parent, grandparent, etc.)
     */
    public function ancestors()
    {
        $ancestors = collect([]);
        $parent = $this->parent;

        while ($parent) {
            $ancestors->push($parent);
            $parent = $parent->parent;
        }

        return $ancestors;
    }

    /**
     * Check if account has children
     */
    public function getHasChildrenAttribute(): bool
    {
        return $this->children()->exists();
    }

    /**
     * Get parent account name
     */
    public function getParentNameAttribute(): ?string
    {
        return $this->parent?->account_name;
    }

    /**
     * Get full account path
     */
    public function getFullPathAttribute(): string
    {
        $path = collect([$this->account_name]);
        $parent = $this->parent;

        while ($parent) {
            $path->prepend($parent->account_name);
            $parent = $parent->parent;
        }

        return $path->implode(' > ');
    }

    /**
     * Scope to get only root accounts (no parent)
     */
    public function scopeRoots($query)
    {
        return $query->whereNull('parent_account_id');
    }

    /**
     * Scope to get only active accounts
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by root account type
     */
    public function scopeByRootType($query, string $type)
    {
        return $query->where('root_account_type', $type);
    }

    /**
     * Scope to filter by account type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('account_type', $type);
    }

    /**
     * Get the tree structure starting from this account
     */
    public function getTreeStructure(): array
    {
        return [
            'id' => $this->id,
            'account_name' => $this->account_name,
            'account_number' => $this->account_number,
            'account_type' => $this->account_type,
            'root_account_type' => $this->root_account_type,
            'balance' => $this->balance,
            'level' => $this->level,
            'has_children' => $this->has_children,
            'children' => $this->children->map(fn($child) => $child->getTreeStructure())->toArray(),
        ];
    }

    /**
     * Boot method to handle events
     */
    protected static function boot()
    {
        parent::boot();

        // Calculate level when creating/updating
        static::saving(function ($account) {
            if ($account->parent_account_id) {
                $parent = Account::find($account->parent_account_id);
                $account->level = $parent ? $parent->level + 1 : 0;
                $account->full_code = $parent 
                    ? $parent->account_number . '.' . $account->account_number 
                    : $account->account_number;
            } else {
                $account->level = 0;
                $account->full_code = $account->account_number;
            }
        });

        // Prevent deletion if account has children
        static::deleting(function ($account) {
            if ($account->has_children) {
                throw new \Exception('Cannot delete account with children. Please delete or reassign child accounts first.');
            }
        });
    }
}
