<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = ['name'];

    public function students()
    {
        return $this->hasMany(Applicant::class, 'course_id');
    }
}
