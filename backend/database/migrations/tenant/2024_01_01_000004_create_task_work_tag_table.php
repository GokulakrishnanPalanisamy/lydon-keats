<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_work_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('work_tag_id')->constrained('work_tags')->cascadeOnDelete();
            $table->timestamps();

            // Prevents attaching the same tag to the same task twice.
            $table->unique(['task_id', 'work_tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_work_tag');
    }
};
