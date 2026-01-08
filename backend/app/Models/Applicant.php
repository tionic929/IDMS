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
}
