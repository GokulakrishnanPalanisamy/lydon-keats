<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('central')->create('technician_organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_id')->constrained('technicians')->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->timestamps();

            // Prevents assigning the same technician to the same
            // organization more than once.
            $table->unique(['technician_id', 'organization_id']);
        });
    }

    public function down(): void
    {
        Schema::connection('central')->dropIfExists('technician_organizations');
    }
};
