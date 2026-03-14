<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'manual_full_name')) {
                $table->string('manual_full_name')->nullable()->after('last_name');
            }
            if (!Schema::hasColumn('students', 'reissuance_reason')) {
                $table->string('reissuance_reason')->nullable()->after('payment_proof');
            }
            if (!Schema::hasColumn('students', 'payment_type')) {
                $table->string('payment_type')->nullable()->after('reissuance_reason');
            }
            if (!Schema::hasColumn('students', 'is_archived')) {
                $table->boolean('is_archived')->default(false)->after('updated_at');
            }
            if (!Schema::hasColumn('students', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('is_archived');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'manual_full_name',
                'reissuance_reason',
                'payment_type',
                'is_archived',
                'archived_at'
            ]);
        });
    }
};
