<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

class Applicant extends Model
{
    use HasFactory, SoftDeletes;

    const TYPE_STUDENT = 'student';
    const TYPE_EMPLOYEE = 'employee';

    protected $table = 'students';

    protected $fillable = [
        'id_number',
        'type',
        'first_name',
        'middle_initial',
        'last_name',
        'course_id',
        'department',
        'address',
        'email',
        'guardian_name',
        'guardian_contact',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function cardApplications()
    {
        return $this->hasMany(CardApplication::class , 'student_id');
    }

    public function latestApplication()
    {
        return $this->hasOne(CardApplication::class , 'student_id')->latestOfMany();
    }

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
}