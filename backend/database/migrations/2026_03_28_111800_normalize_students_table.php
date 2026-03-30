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
        // 1. Create courses table
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Populate courses from students
        $courses = DB::table('students')->select('course')->distinct()->pluck('course');
        foreach ($courses as $course) {
            if ($course) {
                DB::table('courses')->insert(['name' => $course, 'created_at' => now(), 'updated_at' => now()]);
            }
        }

        // 2. Add course_id to students
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->after('last_name')->constrained('courses')->onDelete('set null');
        });

        // 3. Update course_id in students
        DB::statement('UPDATE students s JOIN courses c ON s.course = c.name SET s.course_id = c.id');

        // 4. Create card_applications table
        Schema::create('card_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->uuid('submission_id')->nullable();
            $table->boolean('has_card')->default(false);
            $table->string('application_status')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('processing_status')->nullable();
            
            $table->string('id_picture')->nullable();
            $table->string('id_picture_raw')->nullable();
            $table->string('signature_picture')->nullable();
            $table->string('signature_picture_raw')->nullable();
            
            $table->string('payment_type')->nullable();
            $table->string('payment_proof')->nullable();
            $table->string('reissuance_reason')->nullable();
            
            $table->boolean('is_archived')->default(false);
            $table->timestamp('archived_at')->nullable();
            
            $table->timestamp('processing_started_at')->nullable();
            $table->timestamp('processing_completed_at')->nullable();
            $table->text('processing_error')->nullable();
            $table->integer('retry_count')->default(0);

            $table->timestamps();
        });

        // 5. Migrate Application Data
        DB::statement('
            INSERT INTO card_applications (
                student_id, submission_id, has_card, application_status, rejection_reason, processing_status,
                id_picture, id_picture_raw, signature_picture, signature_picture_raw,
                payment_type, payment_proof, reissuance_reason,
                is_archived, archived_at,
                processing_started_at, processing_completed_at, processing_error, retry_count,
                created_at, updated_at
            )
            SELECT 
                id, submission_id, has_card, application_status, rejection_reason, processing_status,
                id_picture, id_picture_raw, signature_picture, signature_picture_raw,
                payment_type, payment_proof, reissuance_reason,
                is_archived, archived_at,
                processing_started_at, processing_completed_at, processing_error, retry_count,
                created_at, updated_at
            FROM students
        ');

        // 6. Drop old columns from students
        Schema::table('students', function (Blueprint $table) {
            // Unset foreign keys before dropping if there were any indexes related to these
            $table->dropColumn([
                'course',
                'submission_id', 'has_card', 'application_status', 'rejection_reason', 'processing_status',
                'id_picture', 'id_picture_raw', 'signature_picture', 'signature_picture_raw',
                'payment_type', 'payment_proof', 'reissuance_reason',
                'is_archived', 'archived_at',
                'processing_started_at', 'processing_completed_at', 'processing_error', 'retry_count'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add columns back
        Schema::table('students', function (Blueprint $table) {
            $table->string('course', 20)->nullable();
            $table->char('submission_id', 36)->nullable();
            $table->boolean('has_card')->default(false);
            $table->string('application_status')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('processing_status')->nullable();
            
            $table->string('id_picture')->nullable();
            $table->string('id_picture_raw')->nullable();
            $table->string('signature_picture')->nullable();
            $table->string('signature_picture_raw')->nullable();
            
            $table->string('payment_type')->nullable();
            $table->string('payment_proof')->nullable();
            $table->string('reissuance_reason')->nullable();
            
            $table->boolean('is_archived')->default(false);
            $table->timestamp('archived_at')->nullable();
            
            $table->timestamp('processing_started_at')->nullable();
            $table->timestamp('processing_completed_at')->nullable();
            $table->text('processing_error')->nullable();
            $table->integer('retry_count')->default(0);
        });

        // Reverse data migration
        DB::statement('
            UPDATE students s
            JOIN (
                SELECT ca.* 
                FROM card_applications ca 
                INNER JOIN (
                    SELECT student_id, MAX(id) as max_id 
                    FROM card_applications 
                    GROUP BY student_id
                ) latest ON ca.student_id = latest.student_id AND ca.id = latest.max_id
            ) c ON s.id = c.student_id
            SET 
                s.submission_id = c.submission_id,
                s.has_card = c.has_card,
                s.application_status = c.application_status,
                s.rejection_reason = c.rejection_reason,
                s.processing_status = c.processing_status,
                s.id_picture = c.id_picture,
                s.id_picture_raw = c.id_picture_raw,
                s.signature_picture = c.signature_picture,
                s.signature_picture_raw = c.signature_picture_raw,
                s.payment_type = c.payment_type,
                s.payment_proof = c.payment_proof,
                s.reissuance_reason = c.reissuance_reason,
                s.is_archived = c.is_archived,
                s.archived_at = c.archived_at,
                s.processing_started_at = c.processing_started_at,
                s.processing_completed_at = c.processing_completed_at,
                s.processing_error = c.processing_error,
                s.retry_count = c.retry_count
        ');

        DB::statement('UPDATE students s JOIN courses c ON s.course_id = c.id SET s.course = c.name');

        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });

        Schema::dropIfExists('card_applications');
        Schema::dropIfExists('courses');
    }
};
