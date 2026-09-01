<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_technician', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();

            // No foreign key here on purpose: technicians live in the
            // separate central database, so there's nothing in this
            // (tenant) database to reference. Membership is verified at
            // the application layer instead (see TechnicianTaskController
            // and TaskRequest's technician_ids validation).
            $table->unsignedBigInteger('technician_id');

            // Per-assignment progress — a technician's own status on
            // "their" copy of a shared task, independent of any other
            // technician also assigned to it.
            $table->string('status')->default('assigned');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamps();

            $table->unique(['task_id', 'technician_id']);
            $table->index('technician_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_technician');
    }
};
