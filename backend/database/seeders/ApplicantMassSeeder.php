<?php

namespace Database\Seeders;

use App\Models\Applicant;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ApplicantMassSeeder extends Seeder
{
    public function run()
    {
        // Performance optimizations
        DB::disableQueryLog();
        Applicant::unsetEventDispatcher();

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $total = 1_000_000;
        $batch = 5_000;
        
        // Get the current time once to reuse, or use factory dates
        $now = Carbon::now()->format('Y-m-d H:i:s');

        $this->command->info("Starting mass seeding of $total records...");

        for ($i = 0; $i < $total; $i += $batch) {
            $rows = Applicant::factory()
                ->count($batch)
                ->make()
                ->map(function ($applicant) use ($now) {
                    $data = $applicant->toArray();
                    
                    // Manually format dates for MySQL compatibility
                    $data['created_at'] = $applicant->created_at 
                        ? Carbon::parse($applicant->created_at)->format('Y-m-d H:i:s') 
                        : $now;
                        
                    $data['updated_at'] = $applicant->updated_at 
                        ? Carbon::parse($applicant->updated_at)->format('Y-m-d H:i:s') 
                        : $now;

                    return $data;
                })
                ->toArray();

            DB::table('students')->insert($rows);
            
            // Progress output in console
            $current = $i + $batch;
            $this->command->comment("Seeded $current / $total...");
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->command->info("Seeding complete!");
    }
}