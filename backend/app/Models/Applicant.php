<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Applicant extends Model
{
    use HasFactory;

    protected $table = 'students';
    
    protected $casts = [
        'has_card' => 'boolean',
    ];
    
    protected $fillable = [
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
    ];

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
