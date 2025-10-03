<?php

// database/migrations/2025_01_01_000000_create_pickup_rules_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('pickup_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hijo_id');
            $table->unsignedBigInteger('personal_id');
            $table->json('allowed_days');           // e.g. ["mon","wed","fri"]
            $table->boolean('active')->default(true);
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->foreign('hijo_id')->references('id')->on('hijos')->onDelete('cascade');
            $table->foreign('personal_id')->references('id')->on('personals')->onDelete('cascade');

            $table->unique(['hijo_id','personal_id']); // una regla por pareja hijo-tutor
            $table->index(['hijo_id']);
            $table->index(['personal_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('pickup_rules');
    }
};
