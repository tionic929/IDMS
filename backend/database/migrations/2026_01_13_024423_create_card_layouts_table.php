<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('card_layouts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Main ID Layout'); // Label for the layout
            $table->enum('side', ['FRONT', 'BACK']);           // Identifies which side this JSON belongs to
            $table->json('config');                            // Stores the Fabric.js JSON string
            $table->boolean('is_active')->default(true);       // Set as the "Main" layout
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_layouts');
    }
};
