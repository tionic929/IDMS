<?php
namespace Database\Seeders;

use App\Models\Applicant;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class ApplicantMassSeeder extends Seeder
{
    public function run()
    {
        DB::disableQueryLog();
        Applicant::unsetEventDispatcher();

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $total = 1_000_000;
        $batch = 5_000;

        for ($i = 0; $i < $total; $i += $batch) {
            $rows = Applicant::factory()
                ->count($batch)
                ->make()
                ->toArray();

            DB::table('students')->insert($rows);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
}
