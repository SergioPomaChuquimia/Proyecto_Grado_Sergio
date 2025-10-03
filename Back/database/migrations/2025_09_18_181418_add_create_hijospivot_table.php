<?php

// database/migrations/2025_09_18_000002_create_hijo_personal_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hijo_personal', function (Blueprint $table) {
            $table->unsignedBigInteger('hijo_id');
            $table->unsignedBigInteger('personal_id');

            $table->primary(['hijo_id', 'personal_id']);
            $table->foreign('hijo_id')->references('id')->on('hijos')->onDelete('cascade');
            $table->foreign('personal_id')->references('id')->on('personals')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hijo_personal');
    }
};

