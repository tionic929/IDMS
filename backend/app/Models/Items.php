<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Items extends Model
{
    use HasFactory;

    protected $table = 'import_items';
    public $timestamps = false;

    protected $fillable = [            
        'id_number',
        'last_name',
        'first_name',
        'middle_name',
        'sex',
        'course',
        'year_level',
        'units',
        'section',
        'email',
        'contact_no',
        'birth_date',
        'citizen',
        'lrn',
        'strand',
        'validation_date',
    ];
}
