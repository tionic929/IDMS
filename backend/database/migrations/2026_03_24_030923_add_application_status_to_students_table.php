<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'application_status')) {
                $table->string('application_status')->default('pending')->after('has_card'); 
                $table->text('rejection_reason')->nullable()->after('application_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['application_status', 'rejection_reason']);
        });
    }
};
