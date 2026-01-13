<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardLayout extends Model
{
    protected $fillable = ['name', 'side', 'config', 'is_active'];

    protected $casts = [
        'config' => 'array', 
        'is_active' => 'boolean', 
    ];
}