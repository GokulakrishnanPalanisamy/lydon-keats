<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('central')->table('organizations', function (Blueprint $table) {
            $table->foreign('admin_user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::connection('central')->table('organizations', function (Blueprint $table) {
            $table->dropForeign(['admin_user_id']);
        });
    }
};
