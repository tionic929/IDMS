<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add performance indexes for high-load DB optimization.
     * These indexes cover the most frequently-used query patterns:
     *   - Card management queue (is_archived + has_card)
     *   - Sorted queue listing (is_archived + has_card + created_at)
     *   - Analytics by department (course + created_at)
     *   - Dashboard trends (has_card + created_at)
     *   - Status filtering (application_status)
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Single-column indexes for common WHERE clauses
            $table->index('has_card');
            $table->index('is_archived');
            $table->index('application_status');
            $table->index('created_at');
            $table->index('updated_at');

            // Composite indexes for frequently-used query patterns
            $table->index(['is_archived', 'has_card'], 'idx_students_active_queue');
            $table->index(['is_archived', 'has_card', 'created_at'], 'idx_students_sorted_queue');
            $table->index(['course', 'created_at'], 'idx_students_dept_analytics');
            $table->index(['has_card', 'created_at'], 'idx_students_card_trends');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['has_card']);
            $table->dropIndex(['is_archived']);
            $table->dropIndex(['application_status']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['updated_at']);
            $table->dropIndex('idx_students_active_queue');
            $table->dropIndex('idx_students_sorted_queue');
            $table->dropIndex('idx_students_dept_analytics');
            $table->dropIndex('idx_students_card_trends');
        });
    }
};
