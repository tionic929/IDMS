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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->boolean('has_card')->default(false); // As seen in your table desc
            $table->string('id_number')->unique();
            $table->string('first_name');
            $table->string('middle_initial', 1)->nullable();
            $table->string('last_name');
            $table->string('course', 20)->index(); // 'MUL' in Key column usually implies an index
            $table->string('address');
            $table->string('guardian_name');
            $table->string('guardian_contact');
            $table->string('id_picture')->nullable();
            $table->string('signature_picture')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};