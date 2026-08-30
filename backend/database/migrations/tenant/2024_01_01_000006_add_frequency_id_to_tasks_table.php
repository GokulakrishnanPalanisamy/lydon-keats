<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nullable at the DB level (so this doesn't break any tenant that
        // already has tasks) — the "required" rule lives in TaskRequest.
        // restrictOnDelete() backs up the application-level check in
        // FrequencyController::destroy() that blocks deleting a frequency
        // still assigned to tasks.
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('frequency_id')->nullable()->after('description')
                ->constrained('frequencies')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['frequency_id']);
            $table->dropColumn('frequency_id');
        });
    }
};
