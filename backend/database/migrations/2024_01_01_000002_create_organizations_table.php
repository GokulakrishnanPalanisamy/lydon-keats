<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('central')->create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');

            // Nullable here: the admin doesn't exist yet when an
            // organization row is first created. The foreign key itself is
            // added afterwards, once the admins table exists (see the
            // add_admin_foreign_to_organizations_table migration).
            $table->unsignedBigInteger('admin_id')->nullable();

            $table->string('database_host')->nullable();
            $table->string('database_name')->nullable();
            $table->string('database_username')->nullable();
            $table->text('database_password')->nullable();

            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('central')->dropIfExists('organizations');
    }
};
