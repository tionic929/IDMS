<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run()
    {
        $totalRecords = 100000;
        $chunkSize = 1000;

        $this->command->getOutput()->progressStart($totalRecords);

        for ($i = 0; $i < ($totalRecords / $chunkSize); $i++) {
            // factory()->make() creates the data in memory without saving to DB yet
            $data = \App\Models\Applicant::factory()->count($chunkSize)->make()->toArray();
            
            $data = array_map(function ($record) {
                // Convert ISO 8601 strings to MySQL format: YYYY-MM-DD HH:MM:SS
                $record['created_at'] = Carbon::parse($record['created_at'])->format('Y-m-d H:i:s');
                $record['updated_at'] = Carbon::parse($record['updated_at'])->format('Y-m-d H:i:s');
                return $record;
            }, $data);

            // Use the DB facade to insert the raw array for massive speed gains
            \Illuminate\Support\Facades\DB::table('students')->insert($data);
            
            $this->command->getOutput()->progressAdvance($chunkSize);
            
            // Clear Faker's unique cache if memory still climbs
            // $this->faker->unique(true); 
        }

        $this->command->getOutput()->progressFinish();
    }
}
