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
        Schema::create('import_items', function (Blueprint $table) {
            $table->id();
            $table->string('id_number')->nullable();
            $table->string('last_name')->nullable();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('sex')->nullable();
            $table->string('course')->nullable();
            $table->string('year_level')->nullable();
            $table->string('units')->nullable();
            $table->string('section')->nullable();
            $table->string('email')->nullable();
            $table->string('contact_no')->nullable();
            $table->string('birth_date')->nullable();
            $table->string('citizen')->nullable();
            $table->string('lrn')->nullable();
            $table->string('strand')->nullable();
            $table->string('validation_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_items');
    }
};
