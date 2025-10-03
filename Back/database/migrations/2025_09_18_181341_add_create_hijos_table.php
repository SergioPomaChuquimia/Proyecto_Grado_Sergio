<?php

// database/migrations/2025_09_18_000001_create_hijos_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hijos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('apellido', 100);
            $table->string('grado', 50)->nullable();
            $table->date('fecha_nac')->nullable();
            $table->dateTime('fecha_registro')->useCurrent();
            $table->dateTime('fecha_modificacion')->nullable()->useCurrentOnUpdate();
            $table->enum('estado', ['activo', 'inactivo'])->default('activo');
            // Si no quieres created_at/updated_at, no añadas $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hijos');
    }
};
