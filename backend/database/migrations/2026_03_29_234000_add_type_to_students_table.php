<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('type')->default('student')->after('id_number');
        });

        // Populate type based on course name
        DB::statement("
            UPDATE students s 
            JOIN courses c ON s.course_id = c.id 
            SET s.type = 'employee' 
            WHERE c.name = 'EMPLOYEE'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
