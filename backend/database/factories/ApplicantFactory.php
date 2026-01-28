<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ApplicantFactory extends Factory
{
    public function definition()
    {
        $courses = [
            'EMPLOYEE', 'MASTERAL', 'BSBA', 'BSIT', 'AB', 
            'BSCRIM', 'BSED', 'BSGE', 'BSN', 'MIDWIFERY', 
            'JD', 'BSHM', 'ABM', 'ICT', 'STEM', 'BEC', 'HUMMS', 'HE'
        ];

        return [
            'id_number' => $this->faker->unique()->numerify('2515######'),
            'first_name' => $this->faker->firstName(),
            'middle_initial' => strtoupper($this->faker->randomLetter()),
            'last_name' => $this->faker->lastName(),
            'course' => $this->faker->randomElement($courses),
            'address' => $this->faker->address(),
            'guardian_name' => $this->faker->name('female'), // Usually mothers/guardians
            'guardian_contact' => $this->faker->phoneNumber(),
            'has_card' => false,
            // 'created_at' => now(),
            // 'updated_at' => now(),
        ];
    }
}