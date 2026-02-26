<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Cache;

class Applicant extends Model
{
    use HasFactory;

    protected $table = 'students';
    
    protected $casts = [
        'has_card' => 'boolean',
    ];
    
    protected $fillable = [
        'id',
        'has_card',
        'id_number',
        'first_name',
        'middle_initial',
        'last_name',
        'course',
        'address',
        'guardian_name',
        'guardian_contact',
        'id_picture',
        'signature_picture',
        'created_at',
    ];

    /**
     * The "booted" method of the model.
     * Handles automatic cache invalidation.
     */
    protected static function booted()
    {
        // Logic to clear cache whenever data changes
        $clearStudentCache = function ($applicant) {
            // 1. Clear the sidebar counts (global key)
            Cache::forget('dept_counts');

            // 2. Clear all student lists using Tags
            // This works perfectly with Redis to clear all paginated/filtered results at once
            if (config('cache.default') === 'redis') {
                Cache::tags(['students_list'])->flush();
            }
        };

        static::created($clearStudentCache);
        static::updated($clearStudentCache);
        static::deleted($clearStudentCache);
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_initial} {$this->last_name}");
    }

    public function getIdPhotoUrlAttribute(): ?string
    {
        return $this->id_picture
            ? asset('storage/' . $this->id_picture)
            : null;
    }

    public function getSignatureUrlAttribute(): ?string
    {
        return $this->signature_picture
            ? asset('storage/' . $this->signature_picture)
            : null;
    }
}