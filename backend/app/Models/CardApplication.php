<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardApplication extends Model
{
    protected $casts = [
        'has_card' => 'boolean',
        'is_archived' => 'boolean',
        'processing_started_at' => 'datetime',
        'processing_completed_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    protected $fillable = [
        'student_id',
        'submission_id',
        'has_card',
        'application_status',
        'rejection_reason',
        'processing_status',
        'id_picture',
        'id_picture_raw',
        'signature_picture',
        'signature_picture_raw',
        'payment_type',
        'payment_proof',
        'reissuance_reason',
        'is_archived',
        'archived_at',
        'processing_started_at',
        'processing_completed_at',
        'processing_error',
        'retry_count',
    ];

    public function student()
    {
        return $this->belongsTo(Applicant::class, 'student_id');
    }

    public function scopeActive($query)
    {
        return $query->where('card_applications.is_archived', false);
    }

    public function scopeArchived($query)
    {
        return $query->where('card_applications.is_archived', true);
    }

    public function scopeJoinDetails($query)
    {
        return $query->select('card_applications.*', 'courses.name as course')
            ->join('students', 'card_applications.student_id', '=', 'students.id')
            ->leftJoin('courses', 'students.course_id', '=', 'courses.id');
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

    public function getPaymentProofUrlAttribute(): ?string
    {
        return $this->payment_proof
            ? asset('storage/' . $this->payment_proof)
            : null;
    }
}
