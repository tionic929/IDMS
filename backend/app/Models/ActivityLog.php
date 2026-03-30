<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user',
        'action',
        'type',
        'details',
        'status',
        'ip',
    ];

    /**
     * Relationship to the User model.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for system logs.
     */
    public function scopeSystem($query)
    {
        return $query->whereIn('type', ['system', 'auth']);
    }

    /**
     * Scope for activity logs.
     */
    public function scopeActivity($query)
    {
        return $query->whereNotIn('type', ['system', 'auth']);
    }
}
