<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardLayout extends Model
{
    protected $fillable = ['name', 'front_config', 'back_config', 'is_active'];

    protected $casts = [
        'front_config' => 'array',
        'back_config' => 'array',
        'is_active' => 'boolean',
    ];
}